
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('[App] 启动初始化程序...');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("[App] 找不到挂载点 #root");
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;padding:20px;background:red;color:white;z-index:10000';
  errorDiv.innerText = 'Fatal Error: Missing #root element in DOM.';
  document.body.appendChild(errorDiv);
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('[App] React 挂载完成');
    
    // 挂载成功后移除加载层（如果有）
    const loader = document.querySelector('.initial-loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('opacity-0');
        setTimeout(() => loader.remove(), 500);
      }, 300);
    }
  } catch (err) {
    console.error('[App] 挂载时发生崩溃:', err);
  }
}
