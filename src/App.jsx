import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import liff from '@line/liff'
import axios from 'axios'
import { setUserInfo, setTurnPlayer, setWinaRow, setClearAlert, setPlayerColor, setPlayOX, setClearArrOX } from './store/storeConfig'
import './App.css'

const App = () => {
  const dispatch = useDispatch()
  const liffidG = '2006433189-Bb8W3M0d'
  const urlSheets = 'https://api.sheetbest.com/sheets/0cd97f0d-00cb-490c-a68a-79c0346fb722'

  const [isBattle, setIsBattle] = useState(false)
  const [isRank, setIsRank] = useState(false)
  const [isQr, setIsQr] = useState(false)
  const [arrrank, setArrRank] = useState([])
  const [ingame, setInGame] = useState(false)
  const userinfo = useSelector((state) => state.userinfo)
  const playerColor = useSelector((state) => state.playerColor)
  const botColor = useSelector((state) => state.botColor)
  const turnPlayer = useSelector((state) => state.turnPlayer)
  const arrgameox = useSelector((state) => state.arrgameox)
  const score = useSelector((state) => state.userinfo.score)
  const winarow = useSelector((state) => state.winarow)
  const jsonalert = useSelector((state) => state.jsonalert)
  const alertcolor = useSelector((state) => state.jsonalert.color)
  const arrTempCheck = ['123', '159', '147', '456', '258', '789', '369', '357']

  useEffect(() => {
    fnInitLine()
  }, [])

  useEffect(() => {
    if (userinfo.lineid) {
      axios.put(`${urlSheets}/lineid/${userinfo.lineid}` , userinfo).then(() => { setTimeout(() => { fnUserSheetGetdata(null); }, 2000) })
    }
  }, [score])

  useEffect(() => {
    setTimeout(() => {
      dispatch(setClearAlert())
    }, 10000)
  }, [alertcolor])

  const fnInitLine = () => {
    liff.init({ liffId: liffidG }, () => {
      if (!liff.isLoggedIn()) {
        liff.login()
      }
      else {
        fnSetUserinfo()
      }
    })
  }

  /* Function Getdata User From Sheet */
  const fnSetUserinfo = () => {
    liff.getProfile().then(profile => {
      fnUserSheetGetdata(profile)
    })
  }
  const fnUserSheetGetdata = async (profile) => {
    /* const linetoken = liff.getIDToken() */
    const resp = await axios.get(urlSheets)
    let arrUserSheet = await fnUserSheetConvertData(resp)
    if (profile) {
      arrUserSheet = await arrUserSheet.filter((item) => item.lineid == profile.userId)
      const jsuserinfo = {
        lineid: profile.userId,
        linename: profile.displayName,
        linestatus: profile.statusMessage,
        linepic: profile.pictureUrl,
        score: 0,
        winarow: 0
      }
      if (!arrUserSheet.length) {
        await axios.post(urlSheets, jsuserinfo)
      }
      else {
        jsuserinfo.score = parseInt(arrUserSheet[0].score || 0)
        jsuserinfo.winarow = parseInt(arrUserSheet[0].winarow || 0)
      }

      dispatch(setUserInfo(jsuserinfo))
    }
    /* process rank */
    const arrUserSheetSort = await arrUserSheet.sort((a, b) => parseInt((b.score ? b.score : 0)) - parseInt((a.score ? a.score : 0))).slice(0,5)
    setArrRank(arrUserSheetSort)
  }
  const fnUserSheetConvertData = (resp) => {
    return (resp && resp.data ? resp.data : [])
  }

  /* Menu [Battle, Rank] */
  const fnClickMenu = (ismenu) => {
    if (ismenu === 'battle') {
      setIsBattle(!isBattle)
      setIsRank(false)
      setIsQr(false)
    }
    else if (ismenu === 'rank') {
      setIsBattle(false)
      setIsRank(!isRank)
      setIsQr(false)
    }
    else if (ismenu === 'qr') {
      setIsBattle(false)
      setIsRank(false)
      setIsQr(!isQr)
    }
    dispatch(setClearArrOX())
    dispatch(setTurnPlayer(true))
  }

  /* Player Click Box */
  const fnPlayOX = async (box) => {
    await setInGame(true)
    await dispatch(setPlayOX(box))
    if (fnCheckWin(box, true)) {
      fnBotPlay(box)
    }
  }

  /* Auto Bot */
  const fnBotPlay = (box) => {
    let strbox = ''
    /* filter box bot checked */
    const strBoxChkBot = arrgameox.filter((item) => item.chkby == 'bot').map((item) => { return item.box }).join('')
    /* filter box player checked */
    const strBoxChkPlayer = arrgameox.filter((item) => item.chkby == 'player' || (item.box == box)).map((item) => { return item.box }).join('')

    /* map data miss 1 letter of bot */
    const arrfilterBot = arrTempCheck.map((item) => {
      let strmiss = ''
      strmiss += (!~strBoxChkBot.indexOf(item[0]) ? item[0] : '')
      strmiss += (!~strBoxChkBot.indexOf(item[1]) ? item[1] : '')
      strmiss += (!~strBoxChkBot.indexOf(item[2]) ? item[2] : '')
      return (strmiss.length == 1 ? strmiss : '')
    })
    /* filter data miss 1 letter of bot is not found player checked box */
    strbox = arrfilterBot.filter((txt) => txt && !~strBoxChkPlayer.indexOf(txt)).join('')

    if (!strbox) {
      /* map data miss 1 letter of player */
      const arrfilterPlayer = arrTempCheck.map((item) => {
        let strmiss = ''
        strmiss += (!~strBoxChkPlayer.indexOf(item[0]) ? item[0] : '')
        strmiss += (!~strBoxChkPlayer.indexOf(item[1]) ? item[1] : '')
        strmiss += (!~strBoxChkPlayer.indexOf(item[2]) ? item[2] : '')
        return (strmiss.length == 1 ? strmiss : '')
      })
      /* filter data miss 1 letter of player is not found bot checked box */
      strbox = arrfilterPlayer.filter((txt) => txt && !~strBoxChkBot.indexOf(txt)).join('')
    }
    
    /* filter data box not checked for random */
    const arrBoxEmpty = arrgameox.filter((item) => !item.chkby && item.box != box)
    if (arrBoxEmpty.length || strbox) {
      const rnd = Math.floor(Math.random() * arrBoxEmpty.length)
      strbox = (strbox ? strbox[0] : arrBoxEmpty[rnd].box)
      setTimeout(() => { 
        dispatch(setPlayOX(strbox))
        if (!fnCheckWin(strbox, false)) {
          dispatch(setTurnPlayer(false))
        }
      }, 2000)
    }
  }

  /* Check Pattern for win or lose */
  const fnCheckWin = (box, isplayer) => {
    const chkType = (isplayer ? 'player' : 'bot')
    const strBoxChk = arrgameox.filter((item) => item.chkby == chkType || (item.box == box)).map((item) => { return item.box }).join('')
    const arrfilter = arrTempCheck.filter((item) => ~strBoxChk.indexOf(item[0]) && ~strBoxChk.indexOf(item[1]) && ~strBoxChk.indexOf(item[2]))
    if (arrfilter.length) {
      if (isplayer) {
        dispatch(setTurnPlayer(false))
        fnSetScore(1)
      }
      else {
        fnSetScore(-1)
      }
      setInGame(false)
      return false
    }
    else{
      const strBoxChkFull = arrgameox.filter((item) => item.chkby || (item.box == box)).map((item) => { return item.box }).join('')
      if (strBoxChkFull.length >= 9) {
        dispatch(setWinaRow(0))
        fnDefault()
        setInGame(false)
      }
      return true
    }
  }

  /* Set Score aflter game over */
  const fnSetScore = (score) => {
    dispatch(setWinaRow(score))
    fnDefault()
  }

  /* Default Data */
  const fnDefault = () => {
    setTimeout(() => {
      dispatch(setClearArrOX())
      setTimeout(() => {
        dispatch(setTurnPlayer(true))
      }, 3000)
    }, 2000)
  }

  return (
    <div className='font-mitr text-sm'>
      <div className="min-w-[330px] max-w-[340px] bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 px-6 py-2">
        {/* logout */}
        <div className="flex justify-end px-4 pt-4">
          <button onClick={() => { liff.logout(); liff.login(); }} className="inline-block text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-1.5" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>
          
        {/* line userinfo button[battle & rank] */}
        <div className="flex flex-col items-center pb-8">
          <img className="w-24 h-24 mb-3 rounded-full shadow-lg" src={userinfo.linepic} alt="Bonnie image"/>
          <h5 className="mb-1 text-xl font-medium text-gray-900 dark:text-white">{userinfo.linename}</h5>
          <span className="text-sm text-gray-500 dark:text-gray-400">{userinfo.linestatus}</span>
          <div className="flex mt-4 md:mt-6">
            <button type="button" disabled={!turnPlayer || ingame} onClick={() => { fnClickMenu('battle'); }} className={`${isBattle ? 'bg-gray-100 text-blue-700 dark:text-white dark:bg-gray-700' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-400'} relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700`}>
              Battle
              <div className="absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-pink-600 border-2 border-white rounded-full -top-2 -end-2 border-pink-800">{winarow}</div>
            </button>
            <button type="button" disabled={!turnPlayer || ingame} onClick={() => { fnClickMenu('rank'); }} className={`${isRank ? 'bg-gray-100 text-blue-700 dark:text-white dark:bg-gray-700' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-400'} relative inline-flex items-center py-2 px-4 ms-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700`}>
              Rank
              <div className="absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-green-600 border-2 border-white rounded-full -top-2 -end-2 border-green-800">{score}</div>
            </button>
            <button type="button" disabled={!turnPlayer || ingame} onClick={() => { fnClickMenu('qr'); }} className={`${isQr ? 'bg-gray-100 text-blue-700 dark:text-white dark:bg-gray-700' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-400'} relative inline-flex items-center py-2 px-4 ms-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path d="M3 4.875C3 3.839 3.84 3 4.875 3h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 0 1 3 9.375v-4.5ZM4.875 4.5a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5Zm7.875.375c0-1.036.84-1.875 1.875-1.875h4.5C20.16 3 21 3.84 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 0 1-1.875-1.875v-4.5Zm1.875-.375a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5ZM6 6.75A.75.75 0 0 1 6.75 6h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75A.75.75 0 0 1 6 7.5v-.75Zm9.75 0A.75.75 0 0 1 16.5 6h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75ZM3 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.035-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 0 1 3 19.125v-4.5Zm1.875-.375a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5Zm7.875-.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm6 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75ZM6 16.5a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm9.75 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm-3 3a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm6 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Z" />
              </svg>
              <div className={`${jsonalert.color ? '' : 'hidden'} animate-bounce bg-yellow-600 border-yellow-800 absolute inline-flex items-center justify-center w-14 h-14 text-lg font-bold text-white border-2 border-white rounded-full -top-2 -end-2`}>{jsonalert.extrapoint ? '+2' : jsonalert.point < 0 ? jsonalert.point : `+${jsonalert.point}`}</div>
            </button>
          </div>
        </div>

        {/* bettle zone */}
        <div className={`flex flex-col items-center pb-4 ${isBattle ? '' : 'hidden'}`}>
          <div className="flex mb-4">
            <a href="#" onClick={() => { dispatch(setPlayerColor('pink')); }} className={`${playerColor === 'pink' ? 'outline-none z-10 ring-4 ring-gray-100' : ''} w-[50px] h-[50px] bg-pink-600 rounded-full inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 rounded-lg border border-gray-200`}></a>
            <a href="#" onClick={() => { dispatch(setPlayerColor('green')); }} className={`${playerColor === 'green' ? 'outline-none z-10 ring-4 ring-gray-100' : ''} w-[50px] h-[50px] bg-green-600 rounded-full py-2 px-4 ms-2 text-sm font-medium text-gray-900 rounded-lg border border-gray-200`}></a>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {
              arrgameox.map((item, index) => 
                <button key={index} type="button" disabled={!turnPlayer || item.chkby} onClick={() => { fnPlayOX(`${item.box}`) }} className={`${!turnPlayer && !item.chkby ? 'bg-gray-600' : !item.chkby ? 'bg-white dark:bg-gray-800' : item.chkby == 'player' ? `bg-${playerColor}-600` : `bg-${botColor}-600`} h-[80px] w-[80px] text-gray-900 border border-gray-300 font-medium rounded-lg text-sm dark:text-white dark:border-gray-600 `}></button>   
              )
            }
          </div>
        </div>

        {/* rank zone */}
        <div className={`flex flex-col items-center pb-4 ${isRank ? '' : 'hidden'}`}>
          <div className="w-full max-w-md px-2 py-2 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <div className="flow-root">
              <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                {
                  arrrank.map((item, i) => 
                    <li key={i} className="py-3 sm:py-4">
                      <div className="flex items-center">
                          <div className="flex-shrink-0">
                              <img className="w-8 h-8 rounded-full" src={item.linepic} />
                          </div>
                          <div className="flex-1 min-w-0 ms-4 text-left">
                              <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                                {item.linename}
                              </p>
                          </div>
                          <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                          {item.score ? item.score : '0'}
                          </div>
                      </div>
                    </li>
                  )
                }
              </ul>
            </div>
          </div>
        </div>

        {/* qr zone */}
        <div className={`flex flex-col items-center pb-4 ${isQr ? '' : 'hidden'}`}>
          <img src={'https://img2.pic.in.th/pic/QR-DemoOx.png'} />
          <a href="#" onClick={() => { window.open("https://lin.ee/Yhyyjv2"); }} >
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 100 100">
              <path fill="#a1d3a2" d="M69,82H31c-7.18,0-13-5.82-13-13V31c0-7.18,5.82-13,13-13h38c7.18,0,13,5.82,13,13v38	C82,76.18,76.18,82,69,82z"></path><path fill="#1f212b" d="M69,83H31c-7.72,0-14-6.28-14-14V31c0-7.72,6.28-14,14-14h38c7.72,0,14,6.28,14,14v38	C83,76.72,76.72,83,69,83z M31,19c-6.617,0-12,5.383-12,12v38c0,6.617,5.383,12,12,12h38c6.617,0,12-5.383,12-12V31	c0-6.617-5.383-12-12-12H31z"></path><path fill="#fff" d="M71.5,47.534c0-9.391-9.642-17.034-21.49-17.034s-21.49,7.643-21.49,17.034	c0,8.418,7.644,15.467,17.971,16.802C47.192,64.483,48.5,64.5,48.5,66s-1,2.5-1,3.5c0,0.5,0.5,1,1,1	c3.5,0,13.883-7.421,18.392-12.49C70.008,54.676,71.5,51.29,71.5,47.534z"></path><path fill="#1f212b" d="M48.5,71c-0.771,0-1.5-0.729-1.5-1.5c0-0.557,0.228-1.063,0.468-1.599C47.73,67.32,48,66.719,48,66	c0-0.809-0.422-0.969-1.317-1.121c-0.105-0.018-0.205-0.035-0.295-0.054C35.761,63.453,28.02,56.178,28.02,47.534	C28.02,37.866,37.884,30,50.01,30S72,37.866,72,47.534c0,3.865-1.551,7.403-4.743,10.818C63.031,63.104,52.371,71,48.5,71z M50.01,31c-11.574,0-20.99,7.417-20.99,16.534c0,8.135,7.375,14.993,17.535,16.307c0.117,0.023,0.204,0.038,0.296,0.053	C47.548,64.012,49,64.258,49,66c0,0.933-0.329,1.665-0.62,2.311C48.176,68.766,48,69.158,48,69.5c0,0.224,0.276,0.5,0.5,0.5	c3.34,0,13.591-7.345,18.019-12.322C69.579,54.403,71,51.183,71,47.534C71,38.417,61.584,31,50.01,31z"></path><path fill="#1f212b" d="M66.5,78h-33C27.159,78,22,72.841,22,66.5v-33C22,27.159,27.159,22,33.5,22h33	c0.353,0,0.7,0.021,1.045,0.053c0.275,0.025,0.478,0.268,0.453,0.543c-0.025,0.275-0.27,0.479-0.543,0.453	C67.14,23.021,66.823,23,66.5,23h-33C27.71,23,23,27.71,23,33.5v33C23,72.29,27.71,77,33.5,77h33C72.29,77,77,72.29,77,66.5v-17	c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v17C78,72.841,72.841,78,66.5,78z"></path><path fill="#1f212b" d="M77.5,40c-0.276,0-0.5-0.224-0.5-0.5v-2c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v2	C78,39.776,77.776,40,77.5,40z"></path><path fill="#1f212b" d="M77.5,47c-0.276,0-0.5-0.224-0.5-0.5v-4c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v4	C78,46.776,77.776,47,77.5,47z"></path><path fill="#1f212b" d="M42,54h-5c-0.552,0-1-0.448-1-1V43c0-0.552,0.448-1,1-1s1,0.448,1,1v9h4c0.552,0,1,0.448,1,1	S42.552,54,42,54z"></path><path fill="#1f212b" d="M45,54c-0.552,0-1-0.448-1-1V43c0-0.552,0.448-1,1-1s1,0.448,1,1v10C46,53.552,45.552,54,45,54z"></path><path fill="#1f212b" d="M55,54c-0.345,0-0.673-0.179-0.857-0.485L50,46.61V53c0,0.552-0.448,1-1,1s-1-0.448-1-1V43	c0-0.45,0.3-0.844,0.733-0.964c0.437-0.118,0.894,0.064,1.125,0.449L54,49.39V43c0-0.552,0.448-1,1-1s1,0.448,1,1v10	c0,0.45-0.3,0.844-0.733,0.964C55.178,53.988,55.088,54,55,54z"></path><path fill="#1f212b" d="M64,52h-4v-3h3c0.552,0,1-0.448,1-1s-0.448-1-1-1h-3v-3h4c0.552,0,1-0.448,1-1s-0.448-1-1-1h-5	c-0.552,0-1,0.448-1,1v10c0,0.552,0.448,1,1,1h5c0.552,0,1-0.448,1-1S64.552,52,64,52z"></path>
            </svg>
          </a>
        </div>
      </div>

    </div>
  )
}

export default App
