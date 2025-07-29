const axios = require('axios');
const moment = require('moment');
// 拿取env檔資料的套件
// const dotenv = require('dotenv');
// dotenv.config();

// 引入google api套件
const { google } = require('googleapis');

// 設定google api 認證
const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_KEY_JSON),
    // keyFile: 'keyFile.json',
    scopes: ['https://www.googleapis.com/auth/calendar']
});

// 取得使用者名稱
async function GetUserName(userId) {
    let UserName = ''
    try {
        const response = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
            headers: {
                Authorization: 'Bearer ' + process.env.access_token
            }
        });
        UserName = response.data.displayName;
    } catch (error) {
        console.error('Error fetching user name:', error);
        throw error;
    }
    return UserName;
}

// line webhook接收訊息
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    if (req.method === 'POST') {
        console.log('Received webhook:', req.body);
        const UserId = req.body.events[0].source.userId;
        const UserName = await GetUserName(UserId);
        if (req.body.events[0].message.text.includes('借用會議室')) {
            const content = req.body.events[0].message.text;
            let matchDate = content.match(/(\d{1,2}\/\d{1,2})/);
            let Date = matchDate ? moment(matchDate[0], 'M/D').format('YYYY-MM-DD') : '';
            // 取得開始時間
            let matchStartTime = content.match(/(\d{1,2}:\d{2}[\-~～－])/);
            let StartTime = matchStartTime ? moment(matchStartTime[0], 'HH:mm').format('HH:mm') : '';
            // 取得結束時間
            let matchEndTime = content.match(/([\-~～－]\d{1,2}:\d{2})/);
            let EndTime = matchEndTime ? moment(matchEndTime[0], 'HH:mm').format('HH:mm') : '';
            // 取得標題
            let Summary = content.split(' ').slice(1).join(' ');
            // 組合事件
            let caseEvent = {
                'summary': UserName + ' ' + Summary,
                'start': {
                    'dateTime': `${Date}T${StartTime}:00+08:00`,
                    'timeZone': 'Asia/Taipei',
                },
                'end': {
                    'dateTime': `${Date}T${EndTime}:00+08:00`,
                    'timeZone': 'Asia/Taipei',
                },
            }
            // 取得Service Account認證
            const authClient = await auth.getClient();
            const calendar = google.calendar({ version: 'v3', auth: authClient });
            const result = await calendar.events.insert({
                calendarId: '353ad998c6a7082490658174c42ceeacb50bd3a9d1e17689a9241168657c4848@group.calendar.google.com',
                resource: caseEvent,
            });
    
            res.status(200).json({ status: 200, url: result.htmlLink });
        } else {
            res.status(200).end();
        }
    }

};