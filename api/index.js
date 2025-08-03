// const express = require('express');
// const cors = require('cors');
// const axios = require('axios');
// const moment = require('moment');
// 拿取env檔資料的套件
// const dotenv = require('dotenv');
// dotenv.config();

// 引入google api套件
// const { google } = require('googleapis');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000');
// });



// 串接google api的網址，驗證完身分後的首頁
// app.get('/auth', async (req, res) => {
//   const { tokens } = await auth.getToken(req.query.code);
//   auth.setCredentials(tokens);
//   // 驗證完成新增事件
//   try {
//     await readFile()
//     for (const event of AddEventList) {
//       // 組合單一事件
//       if (event.date && event.startTime && event.endTime) {
//         const formattedEvent = {
//           'summary': event.summary,
//           'start': {
//             'dateTime': `${event.date}T${event.startTime}:00+08:00`,
//             'timeZone': 'Asia/Taipei',
//           },
//           'end': {
//             'dateTime': `${event.date}T${event.endTime}:00+08:00`,
//             'timeZone': 'Asia/Taipei',
//           },
//         }
//         const result = await calendar.events.insert({
//           auth: auth,
//           calendarId: 'primary',
//           resource: formattedEvent,
//         });
//       }
//     }
//     res.send({
//       status: 200,
//       message: 'Event added successfully',
//     });
//   } catch (error) {
//     console.error('Error adding event:', error);
//     res.status(500).send({
//       status: 500,
//       message: 'Failed to add event',
//       error: error.message
//     });
//   }
// });

// 建立google calendar
// const calendar = google.calendar({
//   version: 'v3',
//   auth: auth
// });
// 讀取檔案
// const fs = require('fs').promises;
// const path = require('path');

// let AddEventList = []
// async function readFile() {
//   try {
//     const data = await fs.readFile('./content.txt', 'utf8');
//     // 將每句對話分割出來
//     const contents = data.split('\n');
//     for (let content of contents) {
//       if (content.includes('借用會議室')) {
//         // 取得日期
//         let matchDate = content.match(/(\d{1,2}\/\d{1,2})/);
//         let Date = matchDate ? moment(matchDate[0], 'M/D').format('YYYY-MM-DD') : '';
//         // 取得開始時間
//         let matchStartTime = content.match(/(\d{1,2}:\d{2}[\-~～－])/);
//         let StartTime = matchStartTime ? moment(matchStartTime[0], 'HH:mm').format('HH:mm') : '';
//         // 取得結束時間
//         let matchEndTime = content.match(/([\-~～－]\d{1,2}:\d{2})/);
//         let EndTime = matchEndTime ? moment(matchEndTime[0], 'HH:mm').format('HH:mm') : '';
//         // 取得標題
//         let Summary = content.split(' ').slice(1).join(' ');
//         // 建立單一事件
//         let caseEvent = {
//           'summary': Summary,
//           'date': Date,
//           'startTime': StartTime,
//           'endTime': EndTime,
//         }
//         // 放入事件陣列中
//         AddEventList.push(caseEvent);
//       }
//     }

//     // 刪除檔案
//     try {
//       await fs.unlink(path.join(__dirname, 'content.txt'))
//     } catch (err) {
//       console.error(err)
//     }
//   } catch (error) {
//     console.error('Error reading file:', error);
//   }
// }

// app.get('/AddEvent', async (req, res) => {
//   try {
//     await readFile()
//     for (const event of AddEventList) {
//       // 組合單一事件
//       if (event.date && event.startTime && event.endTime) {
//         const formattedEvent = {
//           'summary': event.summary,
//           'start': {
//             'dateTime': `${event.date}T${event.startTime}:00+08:00`,
//             'timeZone': 'Asia/Taipei',
//           },
//           'end': {
//             'dateTime': `${event.date}T${event.endTime}:00+08:00`,
//             'timeZone': 'Asia/Taipei',
//           },
//         }
//         const result = await calendar.events.insert({
//           auth: auth,
//           calendarId: 'primary',
//           resource: formattedEvent,
//         });
//       }
//     }
//     res.send({
//       status: 200,
//       message: 'Event added successfully',
//     });
//   } catch (error) {
//     console.error('Error adding event:', error);
//     res.status(500).send({
//       status: 500,
//       message: 'Failed to add event',
//       error: error.message
//     });
//   }
// });


// export default function handler(req, res) {
//   res.status(200).json({ message: 'API is workingcjs' });
// }
// app.get('/', (req, res) => {
//   res.send(AddEventList);
// });


import axios from 'axios';
import moment from 'moment';
// 拿取env檔資料的套件
// const dotenv = require('dotenv');
// dotenv.config();

// 引入google api套件
import { google } from 'googleapis';

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
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.method === 'POST') {
    if (req.body.events[0].source && req.body.events[0].message.text.includes('借用會議室')) {
      const UserId = req.body.events[0].source.userId;
      const UserName = await GetUserName(UserId);
      const content = req.body.events[0].message.text;
      let matchDate = ''
      if (content.match(/(\d{1,2}\/\d{1,2})/)) {
        matchDate = content.match(/(\d{1,2}\/\d{1,2})/);
      } else if (content.match(/(\d{1,2}\.\d{1,2})/)) {
        matchDate = content.match(/(\d{1,2}\.\d{1,2})/);
      } else if (content.includes('今天')) {
        matchDate = [moment().format('M/D')];
      }
      let Date = matchDate ? moment(matchDate[0], 'M/D').format('YYYY-MM-DD') : '';
      // 取得開始時間
      let matchStartTime = content.match(/(\d{1,2}[:：]\d{2}[\-~～－])/);
      let StartTime = matchStartTime ? moment(matchStartTime[0], 'HH:mm').format('HH:mm') : '';
      // 取得結束時間
      let matchEndTime = content.match(/([\-~～－]\d{1,2}[:：]\d{2})/);
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