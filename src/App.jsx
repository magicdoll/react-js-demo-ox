import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import liff from '@line/liff'
import axios from 'axios'
import { setUserInfo, setTurnPlayer, setWinaRow, setPlayerColor, setPlayOX, setClearArrOX } from './store/storeConfig'
import './App.css'

const App = () => {
  const dispatch = useDispatch()
  const [isBattle, setIsBattle] = useState(false)
  const [isRank, setIsRank] = useState(false)
  const [arrrank, setArrRank] = useState([])
  const userinfo = useSelector((state) => state.userinfo)
  const playerColor = useSelector((state) => state.playerColor)
  const botColor = useSelector((state) => state.botColor)
  const turnPlayer = useSelector((state) => state.turnPlayer)
  const arrgameox = useSelector((state) => state.arrgameox)
  const score = useSelector((state) => state.userinfo.score)
  const arrTempCheck = ['123', '159', '147', '456', '258', '789', '369', '357']
  const liffidG = '2006433189-Bb8W3M0d'
  const urlSheets = 'https://api.sheety.co/9c73846adc8260af06d0b4e795472925/demeSheetOx/userinfo'

  useEffect(() => {
    fnInitLine()
  }, [])

  useEffect(() => {
    if (userinfo.id) {
      const jsuserinfo = {
        userinfo : {
          score: userinfo.score
        }
      }
      axios.put(`${urlSheets}/${userinfo.id}` , jsuserinfo).then(() => { fnUserSheetGetdata(null) })
    }
  }, [score])

  const fnInitLine = () => {
    liff.init({ liffId: liffidG }, () => {
      if (!liff.isLoggedIn()) {
        liff.login()
        /* fnUserSheetGetdata({ userId: 'linidtest1' }) */
      }
      else {
        fnSetUserinfo()
      }
    })
  }

  const fnSetUserinfo = () => {
    liff.getProfile().then(profile => {
      fnUserSheetGetdata(profile)
    })
  }

  const fnUserSheetGetdata = async (profile) => {
    const linetoken = liff.getIDToken()
    const resp = await axios.get(urlSheets)
    let arrUserSheet = await fnUserSheetConvertData(resp)
    console.log('arrUserSheet', arrUserSheet)
    if (profile) {
      arrUserSheet = await arrUserSheet.filter((item) => item.lineid == profile.userId)
      const jsuserinfo = {
        userinfo : {
          linetoken: linetoken,
          lineid: profile.userId,
          linename: profile.displayName /*  || 'ทดสอบๆ' */,
          linestatus: profile.statusMessage /*  || 'ทดสอบๆนะๆ' */,
          linepic: profile.pictureUrl /*  || 'https://placehold.co/400x400' */,
          score: 0
        }
      }
      if (!arrUserSheet.length) {
        await axios.post(urlSheets, jsuserinfo).then((respuserinfo) => {
          const respinsert = fnUserSheetConvertData(respuserinfo)
          console.log('insert', respinsert)
          jsuserinfo.userinfo.id = respinsert[0].id
        })
      }
      else {
        jsuserinfo.userinfo.score = parseInt(arrUserSheet[0].score || 0)
        jsuserinfo.userinfo.id = arrUserSheet[0].id
      }

      dispatch(setUserInfo(jsuserinfo.userinfo))
    }
    
    /* process rank */
    const arrUserSheetSort = arrUserSheet.sort((a, b) => parseInt(b.score) - parseInt(a.score)).slice(0,5)
    setArrRank(arrUserSheetSort)
  }
  const fnUserSheetConvertData = (resp) => {
    return (resp && resp.data && resp.data.userinfo ? resp.data.userinfo : [])
  }

  /* Menu [Battle, Rank] */
  const fnClickMenu = (isbattle) => {
    if (isbattle) {
      setIsBattle(!isBattle)
      setIsRank(false)
    }
    else {
      setIsBattle(false)
      setIsRank(!isRank)
    }
    dispatch(setClearArrOX())
    dispatch(setTurnPlayer(true))
  }

  /* Player Click Box */
  const fnPlayOX = async (box) => {
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
        fnSetScore(1)
      }
      else {
        fnSetScore(-1)
      }
      return false
    }
    else{
      const strBoxChkFull = arrgameox.filter((item) => item.chkby || (item.box == box)).map((item) => { return item.box }).join('')
      if (strBoxChkFull.length >= 9) {
        fnDefault()
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
      dispatch(setTurnPlayer(true))
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
            <a href="#" onClick={() => { fnClickMenu(true); }} className={`${isBattle ? 'bg-gray-100 text-blue-700 dark:text-white dark:bg-gray-700' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-400'} inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700`}>Battle</a>
            <a href="#" onClick={() => { fnClickMenu(false); }} className={`${isRank ? 'bg-gray-100 text-blue-700 dark:text-white dark:bg-gray-700' : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-400'} py-2 px-4 ms-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700`}>Rank</a>
          </div>
        </div>

        {/* bettle zone */}
        <div className={`flex flex-col items-center pb-10 ${isBattle ? '' : 'hidden'}`}>
          <div className="flex mb-4">
            <a href="#" onClick={() => { dispatch(setPlayerColor('pink')); }} className={`${playerColor === 'pink' ? 'outline-none z-10 ring-4 ring-gray-100' : ''} w-[50px] h-[50px] bg-pink-600 rounded-full inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 rounded-lg border border-gray-200`}></a>
            <a href="#" onClick={() => { dispatch(setPlayerColor('green')); }} className={`${playerColor === 'green' ? 'outline-none z-10 ring-4 ring-gray-100' : ''} w-[50px] h-[50px] bg-green-600 rounded-full py-2 px-4 ms-2 text-sm font-medium text-gray-900 rounded-lg border border-gray-200`}></a>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {
              arrgameox.map((item, index) => 
                <button key={index} type="button" disabled={!turnPlayer} onClick={() => { fnPlayOX(`${item.box}`) }} className={`${!turnPlayer && !item.chkby ? 'bg-gray-600' : !item.chkby ? 'bg-white dark:bg-gray-800' : item.chkby == 'player' ? `bg-${playerColor}-600` : `bg-${botColor}-600`} h-[80px] w-[80px] text-gray-900 border border-gray-300 font-medium rounded-lg text-sm dark:text-white dark:border-gray-600 `}></button>   
              )
            }
          </div>
        </div>

        {/* rank zone */}
        <div className={`flex flex-col items-center pb-10 ${isRank ? '' : 'hidden'}`}>
          <div className="w-full max-w-md px-2 py-2 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <div className="flow-root">
              <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                {
                  arrrank.map((item, i) => 
                    <li key={i} className="py-3 sm:py-4">
                      <div className="flex items-center">
                          <div className="flex-shrink-0">
                              <img className="w-8 h-8 rounded-full" src={item.linepic} alt="Neil image" />
                          </div>
                          <div className="flex-1 min-w-0 ms-4 text-left">
                              <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                                {item.linename}
                              </p>
                          </div>
                          <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                          {item.score}
                          </div>
                      </div>
                    </li>
                  )
                }
              </ul>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

export default App
