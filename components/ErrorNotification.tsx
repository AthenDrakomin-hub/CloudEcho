
import React from 'react';
import { AppNotification } from '../types';

interface ErrorNotificationProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-6 right-6 z-[300] flex flex-col space-y-3 pointer-events-none">
      {notifications.map((n) => (
        <div 
          key={n.id}
          className={`pointer-events-auto w-80 md:w-96 backdrop-blur-2xl border p-5 rounded-2xl shadow-2xl flex items-start space-x-4 animate-in slide-in-from-right-10 duration-500 ${
            n.type === 'error' ? 'bg-red-600/10 border-red-600/30' :
            n.type === 'warning' ? 'bg-amber-600/10 border-amber-600/30' :
            n.type === 'success' ? 'bg-green-600/10 border-green-600/30' :
            'bg-white/5 border-white/10'
          }`}
        >
          <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
            n.type === 'error' ? 'bg-red-600 text-white' :
            n.type === 'warning' ? 'bg-amber-600 text-black' :
            n.type === 'success' ? 'bg-green-600 text-white' :
            'bg-white text-black'
          }`}>
            <i className={`fa-solid ${
              n.type === 'error' ? 'fa-circle-exclamation' :
              n.type === 'warning' ? 'fa-triangle-exclamation' :
              n.type === 'success' ? 'fa-circle-check' :
              'fa-circle-info'
            } text-[10px]`}></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1">
              {n.type === 'error' ? '系统异常 (System Error)' : 
               n.type === 'warning' ? '警示提示 (Alert)' : 
               n.type === 'success' ? '操作成功 (Success)' : '系统信息 (Info)'}
            </p>
            <p className="text-xs font-bold text-white leading-relaxed">{n.message}</p>
          </div>
          <button 
            onClick={() => onDismiss(n.id)}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ErrorNotification;
