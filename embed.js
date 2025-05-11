(function () {
  const style = document.createElement('style');
  // Find the <script> tag that loaded this script
  const currentScript = document.currentScript;
  const savedItemId = currentScript?.getAttribute('saved_item_id') || "default_id_if_needed";

  style.textContent = 
    `.emily-wrapper {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 10000;
      font-family: Arial, sans-serif;
    }
    .emily-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid white;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      position: relative;
      z-index: 2;
      transition: opacity 0.3s ease;
    }
    .emily-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .emily-bubble {
      background-color: #5b67f1;
      color: white;
      padding: 10px 18px;
      border-radius: 25px;
      font-size: 16px;
      position: absolute;
      bottom: 75px;
      right: 0;
      white-space: nowrap;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: opacity 0.4s ease, transform 0.4s ease;
    }
    .emily-bubble.hidden {
      opacity: 0;
      transform: translateY(10px);
      pointer-events: none;
    }
    .emily-box {
      display: none;
      flex-direction: column;
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 320px;
      height: 420px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      z-index: 1;
      overflow: hidden;
    }
    .emily-box.active {
      display: flex;
    }
    .emily-header {
      background: linear-gradient(to right, #5b67f1, #8390fa);
      color: white;
      padding: 12px;
      font-size: 16px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .emily-header img {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      margin-right: 10px;
    }
    .emily-messages {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      font-size: 14px;
      color: #333;
    }
    .emily-message {
      margin-bottom: 10px;
    }
    .emily-input {
      display: flex;
      border-top: 1px solid #eee;
    }
    .emily-input input {
      flex: 1;
      border: none;
      padding: 10px;
      font-size: 14px;
      outline: none;
    }
    .emily-input button {
      border: none;
      background: #5b67f1;
      color: white;
      padding: 0 15px;
      font-size: 16px;
      cursor: pointer;
    }
    .emily-input button:hover {
      background: #4c58d6;
    }`
  ;
  document.head.appendChild(style);

  const wrapper = document.createElement('div');
  wrapper.className = 'emily-wrapper';
  wrapper.innerHTML = 
    `<div class="emily-bubble">Hi! How can I help you?</div>
    <div class="emily-avatar">
      <img src="https://i.imgur.com/siG83mP.jpeg" alt="Chat Avatar" />
    </div>
    <div class="emily-box">
      <div class="emily-header">
        <div style="display: flex; align-items: center;">
          <img src="https://i.imgur.com/siG83mP.jpeg" alt="Chat Avatar" />
          Emily <span style="margin-left: 4px; font-size: 12px;">AI</span>
        </div>
        <span style="cursor:pointer;" class="emily-close">×</span>
      </div>
      <div class="emily-messages">
        <p class="emily-message"><strong>Emily:</strong> Hello! How can I help you today?</p>
      </div>
      <div class="emily-input">
        <input type="text" placeholder="Type your message..." />
        <button>➤</button>
      </div>
    </div>`
  ;
  document.body.appendChild(wrapper);

  const avatar = wrapper.querySelector('.emily-avatar');
  const bubble = wrapper.querySelector('.emily-bubble');
  const box = wrapper.querySelector('.emily-box');
  const messages = wrapper.querySelector('.emily-messages');
  const input = wrapper.querySelector('input');
  const button = wrapper.querySelector('button');
  const close = wrapper.querySelector('.emily-close');

  avatar.addEventListener('click', () => {
    box.classList.add('active');
    avatar.style.display = 'none';
    bubble.style.display = 'none';
  });

  close.addEventListener('click', () => {
    box.classList.remove('active');
    avatar.style.display = '';
    bubble.style.display = '';
  });

  button.addEventListener('click', sendMessage);
  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const userMsg = document.createElement('p');
    userMsg.className = 'emily-message';
    userMsg.innerHTML = `<strong>You:</strong> ${text}`;
    messages.appendChild(userMsg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    const typingMsg = document.createElement('p');
    typingMsg.className = 'emily-message emily-typing';
    typingMsg.innerHTML = `<strong>Emily:</strong> Typing.....`;
    messages.appendChild(typingMsg);
    messages.scrollTop = messages.scrollHeight;

    try {
      const response = await fetch('https://gumloop-2zkcfa1kp-vikas70607s-projects.vercel.app/api/gumloop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'process',
          userMessage: text,
          savedItemId: savedItemId
        })
      });

      console.log(response);

      const data = await response.json();
      let replyText = data.outputs?.output || data.output || data.result || 'I didn’t get a response. Please try again.';

      typingMsg.innerHTML = `<strong>Emily:</strong> ${replyText}`;
    } catch (error) {
      typingMsg.innerHTML = `<strong>Emily:</strong> Sorry, something went wrong.`;
      console.error('Chatbot Error:', error);
    }
  }
})();
