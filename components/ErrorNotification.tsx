
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
          className={`pointer-events-auto w-80 md:w-96 p-5 rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] flex items-start space-x-4 animate-in slide-in-from-right-10 duration-500 border-2 ${
            n.type === 'error' ? 'bg-red-600 border-red-400 text-white' :
            n.type === 'warning' ? 'bg-amber-500 border-amber-300 text-black' :
            n.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' :
            'bg-indigo-600 border-indigo-400 text-white'
          }`}
        >
          <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
            n.type === 'error' ? 'bg-white/20' :
            n.type === 'warning' ? 'bg-black/10' :
            n.type === 'success' ? 'bg-white/20' :
            'bg-white/20'
          }`}>
            <i className={`fa-solid ${
              n.type === 'error' ? 'fa-circle-exclamation' :
              n.type === 'warning' ? 'fa-triangle-exclamation' :
              n.type === 'success' ? 'fa-circle-check' :
              'fa-circle-info'
            } text-sm`}></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 opacity-80 ${n.type === 'warning' ? 'text-black/60' : 'text-white/60'}`}>
              {n.type === 'error' ? '系统异常报告' : 
               n.type === 'warning' ? '安全警示' : 
               n.type === 'success' ? '操作已成功' : '系统提示'}
            </p>
            <p className="text-[13px] font-[900] leading-tight drop-shadow-sm">{n.message}</p>
          </div>
          <button 
            onClick={() => onDismiss(n.id)}
            className={`transition-colors p-1 hover:scale-125 ${n.type === 'warning' ? 'text-black/40 hover:text-black' : 'text-white/40 hover:text-white'}`}
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ErrorNotification;
