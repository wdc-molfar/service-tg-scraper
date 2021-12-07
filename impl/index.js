const { extend, differenceBy, last } = require("lodash")
let axios = require("axios")
let cheerio = require("cheerio")
let md5 = require("md5")
let moment = require("moment")

let getChannelMetadata = (data, scraper)=> {
    $ = cheerio.load(data.html)
    
    let title = $('div.tgme_channel_info_header_title > span').text()
    let description = $('div.tgme_channel_info_description').html()
    let image = $('div.tgme_channel_info > div.tgme_channel_info_header > i > img').attr("src") 
    
    let lastMessages = []
    $('div.tgme_widget_message_bubble').each( (index, element) => {
        $(element).find("br").before("\n").remove()
        let text = $(element).find("div.tgme_widget_message_text").text().replace(/[\u2000-\uffff]+/g, " ")
        let html = $(element).find("div.tgme_widget_message_text").html()
        let publishedAt =  moment($(element).find("time").attr("datetime")).format("YYYY-MM-DD hh:mm:ss") 
        
        lastMessages.push({
            type:"telegram",
            url:data.url,
            metadata:{
                scraper,
                channel:{
                    name: `@${last(data.url.split("/"))}`,
                    title,
                    description,
                    image
                },
                html,
                text,
                publishedAt
            },
            md5: md5(text),
            createdAt: moment(new Date()).format("YYYY-MM-DD hh:mm:ss") 
        })
    })

    return lastMessages
}


async function scrap(task, scraper){
    
    let response = await axios(
        {
            method:"GET",
            url: task.url.replace("https://t.me/", "https://t.me/s/")
        }
    )
    return getChannelMetadata({
        url: task.url,
        html: response.data
    }, scraper)
}    


module.exports = scrap
