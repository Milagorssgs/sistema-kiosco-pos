import { Lock, Mail, KeyRound } from 'lucide-react';

export default function Login({ 
  manejarLogin, 
  emailInput, 
  setEmailInput, 
  claveInput, 
  setClaveInput 
}) {
  return (
    <div translate="no" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm animate-fade-in text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
        <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-700">
          <Lock className="text-indigo-400" size={28} />
        </div>
        <h1 className="text-2xl font-black text-white tracking-wide mb-1">MotoGest</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Acceso Restringido</p>
        
        <form onSubmit={manejarLogin} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><Mail size={18}/></span>
            <input
              type="email"
              placeholder="Email del local..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 font-bold outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>
          
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><KeyRound size={18}/></span>
            <input
              type="password"
              placeholder="Ingresar contraseña..."
              value={claveInput}
              onChange={(e) => setClaveInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 font-bold outline-none focus:border-indigo-500"
            />
          </div>
          
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl uppercase text-sm tracking-widest">
            Ingresar al sistema
          </button>
        </form>
      </div>
    </div>
  );
}
