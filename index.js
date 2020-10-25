const inLine = '내선'
const outLine = '외선'
const container = document.getElementById('container');
const selectOpt = document.getElementById('selectStation');
const leftCount = document.getElementById('leftCount')

//시간 div
const firstIn = document.getElementById('firstIn')
const secondIn = document.getElementById('secondIn')
const firstOut = document.getElementById('firstOut')
const secondOut = document.getElementById('secondOut')
//image div 
const inFisrt = document.getElementById('inFirst')
const inSecond = document.getElementById('inSecond')
const outFisrt = document.getElementById('outFirst')
const outSecond = document.getElementById('outSecond')

//처음 화면
// window.onload = ()=>{
//   station.innerText = '[역을 선택해 주세요]';
// }

//sec단위를 min:sec로 바꿈
const leftTime = (leftsec) => {
  const min = Math.floor(leftsec/ 60)
  const sec = leftsec - (min * 60)
  const strMin = String(min).padStart(2,'0')
  const strSec = String(sec).padStart(2,'0')
  const left = strMin + ' : ' + strSec
  return left;
}

// //숫자만 가져오기
// const filterCheck = (a) =>{
//   if(!isNaN(a)) {
//     return a
//   }
// }
const findCount = (str) => {
  return 1000 - Number(str.split(',')[0])
}
const convertObj = (obj) => {
  const result = {}
  for(const a of Object.keys(obj)){
    result[a] = obj[a][0]    
  }
  return result;
}

//hook 
class Hooks {
  constructor() {
    this._store = {};
  }
  emit(name, payload) {
    if (Array.isArray(this._store[name])) this._store[name].forEach(f => f(payload));
  }
  addHook(name, f) {
    if (!Array.isArray(this._store[name])) this._store[name] = [];
    if (this._store[name].indexOf(f) === -1) this._store[name].push(f);
  }
  removeHook(name, f) {
    if (!Array.isArray(this._store[name])) return;
    const channel = this._store[name];
    if (channel.indexOf(f) !== -1) this._store[name].splice(channel.indexOf(f), 1);
  }
}

//data parsing
const axios = require('axios').default
const xml2js = require('xml2js')
const parser = new xml2js.Parser

class GetTime extends Hooks{
  constructor(name) {
    super();
    this.getData();
    this.url;
    this.station;
    this.inLeftTime;
    this.newA;
    this.leftCountTime;
  }

  getUrl(value) {
    this.station = encodeURI(value)
    this.url = `http://swopenapi.seoul.go.kr/api/subway/6e46585a5362737437354a526f5a53/xml/realtimeStationArrival/0/10/${this.station}`
  }

  getData() {
    //처음 실행될 때 조건
    if(!this.url) {
      leftCount.innerText = '남은호출횟수 :'
      setTimeout(()=> {this.getData()}, 5000);
      return;
    } 
    
    // axios.get('http://3.34.68.5:5000/count').then(res => {
    //   // this.leftCount = 1000 - findCount(res.data)
    //   leftCount.innerText = '남은호출횟수 : ' + findCount(res.data)
    //   console.log(findCount(res.data))
    //   // console.log(this.leftCount)
    // })
    
    //data = xml
    const promise = axios.get(this.url)
    const xml_data = promise.then((response) => {
      axios.get('http://3.34.68.5:5000/count').then(res => {
        leftCount.innerText = '남은호출횟수 : ' + findCount(res.data)
        // console.log(findCount(res.data))
      })
      const {data} = response
      return parser.parseStringPromise(data)
    })
    //result=object로 바꾼 data
    const obj_data = xml_data.then((result) => {
      return result.realtimeStationArrival.row.reduce((acc, curr)=>{
        this.convert = convertObj(curr)

        //if문 내선 외선 나눠서 
        if(this.convert.updnLine == inLine) {
          acc.inkey.push(this.convert.barvlDt)
        }
        else if(this.convert.updnLine == outLine) {
          acc.outkey.push(this.convert.barvlDt)
        }

        return {...acc};
      },{inkey: [], outkey: []})
    })

    obj_data.then((a)=>{
      // console.log(a)
      this.inLineA = a.inkey
      this.outLineA = a.outkey

      //앞에 그려져있는 시간 삭제
      while(firstIn.firstElementChild != null) {
        firstIn.removeChild(firstIn.children[0])
      }
      while(secondIn.firstElementChild != null) {
        secondIn.removeChild(secondIn.children[0])
      }
      while(firstOut.firstElementChild != null) {
        firstOut.removeChild(firstOut.children[0])
      }
      while(secondOut.firstElementChild != null) {
        secondOut.removeChild(secondOut.children[0])
      }

      //그려주기 직전에 데이터 가공
      this.inLeftTime = this.inLineA.map((currentValue) => {
        return leftTime(Number(currentValue))
      })
      for(let i = 0; i < 2; i++) {
        if(!this.inLeftTime[i]) {
          this.inLeftTime[i] = '도착예정 열차없음'
        }
      }
      
      this.outLeftTime = this.outLineA.map((currentValue) => {
        return leftTime(Number(currentValue))
      })
      for(let i = 0; i < 2; i++) {
        if(!this.outLeftTime[i]) {
          this.outLeftTime[i] = '도착예정 열차없음'
        }
      }
      // console.log(this.inLeftTime, this.outLeftTime)

      this.emit('drawIn', [...this.inLeftTime])
      this.emit('drawOut', [...this.outLeftTime])
      this.emit('moveIn', [...this.inLineA])
      this.emit('moveOut', [...this.outLineA])
      setTimeout(()=> {this.getData()}, 5000)
    })
  }
}

window.getTime = new GetTime('newname');

//selectBox에서 선택된 값 가져오기
selectOpt.addEventListener("change", (evt) => {
  const value = evt.target.value;
  getTime.getUrl(value);
})

getTime.addHook('drawIn',(times) => {
  drawInTime(times)
})
getTime.addHook('drawOut',(times) => {
  drawOutTime(times)
})
getTime.addHook('moveOut',(arr)=>{
  moveOut(arr)
})
getTime.addHook('moveIn',(arr)=>{
  moveIn(arr)
})

// getTime.addHook('update', (times) => {
//   writeTime(times)
// })

const drawInTime = (arr) => {
  arr.map((currentValue, index) => {
    const div = document.createElement('div')
    if(index == 0) {
      // console.log(firstIn)
      div.innerText = '전 열차 : ' + currentValue
      firstIn.appendChild(div)
    }
    else if(index == 1) {
      div.innerText = '전전 열차 : ' + currentValue
      secondIn.appendChild(div)
    } 
  })
}
const drawOutTime = (arr) => {
  arr.map((currentValue, index) => {
    // console.log(currentValue, index)
    const div = document.createElement('div')
    if(index == 0) {
      div.innerText = '전 열차 : ' + currentValue
      firstOut.appendChild(div)
    } 
    else if(index == 1) {
      div.innerText = '전전 열차 : ' + currentValue
      secondOut.appendChild(div)
    } 
  })
}
const moveIn = (arr) => {
  if(arr[0] <= 10) inFisrt.style.left = '80%';
  else if(arr[0] > 10 && arr[0] <= 60) inFisrt.style.left = '70%';
  else if(arr[0] > 60 && arr[0] <= 120) inFisrt.style.left = '60%';
  else if(arr[0] > 120 && arr[0] <= 180) inFisrt.style.left = '50%';
  else if(arr[0] > 180 && arr[0] <= 240) inFisrt.style.left = '40%';
  else if(arr[0] > 240 && arr[0] <= 300) inFisrt.style.left = '30%';
  else if(arr[0] > 300 && arr[0] <= 360) inFisrt.style.left = '20%';
  else if(arr[0] > 360 && arr[0] == 420) inFisrt.style.left = '10%';
  else if(arr[0] > 420 || arr[0] == null) inFisrt.style.left = '0%';

  if(arr[1] <= 10) inSecond.style.left = '80%';
  else if(arr[1] > 10 && arr[1] <= 60) inSecond.style.left = '70%';
  else if(arr[1] > 60 && arr[1] <= 120) inSecond.style.left = '60%';
  else if(arr[1] > 120 && arr[1] <= 180) inSecond.style.left = '50%';
  else if(arr[1] > 180 && arr[1] <= 240) inSecond.style.left = '40%';
  else if(arr[1] > 240 && arr[1] <= 300) inSecond.style.left = '30%';
  else if(arr[1] > 300 && arr[1] <= 360) inSecond.style.left = '20%';
  else if(arr[1] > 360 && arr[1] == 420) inSecond.style.left = '10%';
  else if(arr[1] > 420 || arr[1] == null) inSecond.style.left = '0%';
}
const moveOut = (arr) => {
  // console.log(arr[0])
  if(arr[0] <= 10) outFirst.style.left = '80%';
  else if(arr[0] > 10 && arr[0] <= 60) outFirst.style.left = '70%';
  else if(arr[0] > 60 && arr[0] <= 120) outFirst.style.left = '60%';
  else if(arr[0] > 120 && arr[0] <= 180) outFirst.style.left = '50%';
  else if(arr[0] > 180 && arr[0] <= 240) outFirst.style.left = '40%';
  else if(arr[0] > 240 && arr[0] <= 300) outFirst.style.left = '30%';
  else if(arr[0] > 300 && arr[0] <= 360) outFirst.style.left = '20%';
  else if(arr[0] > 360 && arr[0] <= 420) outFirst.style.left = '10%';
  else if(arr[0] > 420 || arr[0] == null) outFirst.style.left = '0%';
  
  if(arr[1] <= 10) outSecond.style.left = '80%';
  else if(arr[1] > 10 && arr[1] <= 60) outSecond.style.left = '70%';
  else if(arr[1] > 60 && arr[1] <= 120) outSecond.style.left = '60%';
  else if(arr[1] > 120 && arr[1] <= 180) outSecond.style.left = '50%';
  else if(arr[1] > 180 && arr[1] <= 240) outSecond.style.left = '40%';
  else if(arr[1] > 240 && arr[1] <= 300) outSecond.style.left = '30%';
  else if(arr[1] > 300 && arr[1] <= 360) outSecond.style.left = '20%';
  else if(arr[1] > 360 && arr[1] <= 420) outSecond.style.left = '10%';
  else if(arr[1] > 420 || arr[1] == null) outSecond.style.left = '0%';

}

// const writeTime = (a) => {
//   console.log(a)
// }