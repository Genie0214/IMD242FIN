// 종횡비를 고정하고 싶을 경우: 아래 두 변수를 0이 아닌 원하는 종, 횡 비율값으로 설정.
// 종횡비를 고정하고 싶지 않을 경우: 아래 두 변수 중 어느 하나라도 0으로 설정.
const aspectW = 4;
const aspectH = 3;
// html에서 클래스명이 container-canvas인 첫 엘리먼트: 컨테이너 가져오기.
const container = document.body.querySelector('.container-canvas');

// 필요에 따라 이하에 변수 생성.
let video; // 비디오 요소
let handpose; // Handpose 모델
let predictions = []; // 손 관절 데이터를 저장할 변수
let message = 'Hello World!'; // 초기 말풍선 텍스트

function setup() {
  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();

  if (aspectW === 0 || aspectH === 0) {
    createCanvas(containerW, containerH).parent(container);
  } else if (containerW / containerH > aspectW / aspectH) {
    createCanvas((containerH * aspectW) / aspectH, containerH).parent(
      container
    );
  } else {
    createCanvas(containerW, (containerW * aspectH) / aspectW).parent(
      container
    );
  }

  // 비디오 요소 생성 및 초기화
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // Handpose 모델 초기화
  handpose = ml5.handpose(video, modelReady);
  handpose.on('predict', (results) => {
    predictions = results;
  });

  init();
}

function modelReady() {
  console.log('Handpose 모델이 로드되었습니다.');
}

function init() {
  console.log('초기화 완료');
}

function draw() {
  background('white');
  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const hand = predictions[0];

    // 손 모양에 따라 텍스트 변경
    if (isCallMe(hand)) {
      message = 'Call me~';
    } else if (isThumbsUp(hand)) {
      message = 'Good!';
    } else if (isFist(hand)) {
      message = 'Cheer Up!!!';
    } else if (isVSign(hand)) {
      message = 'Kimchi~!';
    } else {
      message = 'Hello World!';
    }

    const bubbleX = width / 2;
    const bubbleY = height / 4 - 50;
    const bubbleWidth = 400;
    const bubbleHeight = 200;

    drawSpeechBubble(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
    drawTextInBubble(message, bubbleX, bubbleY, 44);
  }
}

// "Call me" 제스처 감지 함수
function isCallMe(hand) {
  const landmarks = hand.landmarks;
  const thumbTip = landmarks[4]; // 엄지 끝
  const pinkyTip = landmarks[20]; // 새끼 끝
  const palmBase = landmarks[9]; // 손바닥 중심

  // 나머지 손가락 끝과 손바닥 중심 거리
  const foldedFingers = [8, 12, 16].every((i) => {
    const tip = landmarks[i];
    return dist(tip[0], tip[1], palmBase[0], palmBase[1]) < 50;
  });

  // 엄지와 새끼가 펼쳐진 상태
  const thumbPinkySpread = dist(
    thumbTip[0],
    thumbTip[1],
    pinkyTip[0],
    pinkyTip[1]
  );

  return thumbPinkySpread > 100 && foldedFingers;
}

// 엄지손가락 치켜든 상태 감지 함수
function isThumbsUp(hand) {
  const landmarks = hand.landmarks;
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const palmBase = landmarks[9];

  const distances = [8, 12, 16, 20].map((i) => {
    const tip = landmarks[i];
    return dist(tip[0], tip[1], palmBase[0], palmBase[1]);
  });

  const thumbDirection = thumbTip[1] < wrist[1] ? 'up' : 'down';
  return (
    thumbDirection === 'up' &&
    thumbTip[1] < palmBase[1] &&
    distances.every((d) => d < 50)
  );
}

// 손가락을 모두 오므린 상태 감지 함수
function isFist(hand) {
  const landmarks = hand.landmarks;
  const palmBase = landmarks[9];
  return [4, 8, 12, 16, 20].every((i) => {
    const tip = landmarks[i];
    return dist(tip[0], tip[1], palmBase[0], palmBase[1]) < 50;
  });
}

// 브이(V) 손 모양 감지 함수
function isVSign(hand) {
  const landmarks = hand.landmarks;
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const indexMiddleSpread = dist(
    indexTip[0],
    indexTip[1],
    middleTip[0],
    middleTip[1]
  );
  const middleRingSpread = dist(
    middleTip[0],
    middleTip[1],
    ringTip[0],
    ringTip[1]
  );

  return (
    indexMiddleSpread > 50 &&
    middleRingSpread > 30 &&
    ringTip[1] > middleTip[1] &&
    pinkyTip[1] > middleTip[1]
  );
}

// 말풍선 그리기 함수
function drawSpeechBubble(x, y, w, h) {
  fill(255);
  stroke(0);
  strokeWeight(2);
  rectMode(CENTER);
  rect(x, y, w, h, 20);
  triangle(x - w / 8, y + h / 2, x + w / 8, y + h / 2, x, y + h / 2 + 20);
}

// 말풍선 내부 텍스트 그리기 함수
function drawTextInBubble(textContent, x, y, textSizeValue) {
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(textSizeValue);
  text(textContent, x, y);
}

function windowResized() {
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();

  if (aspectW === 0 || aspectH === 0) {
    resizeCanvas(containerW, containerH);
  } else if (containerW / containerH > aspectW / aspectH) {
    resizeCanvas((containerH * aspectW) / aspectH, containerH);
  } else {
    resizeCanvas(containerW, (containerW * aspectH) / aspectW);
  }
}
