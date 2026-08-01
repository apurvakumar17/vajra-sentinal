import { ShieldAlert, BrainCircuit, ExternalLink } from 'lucide-react'

export default function Alerts() {
  const alertData = {
    id: "ALT-9001",
    user: "Rahul Sharma",
    severity: "Critical",
    score: 85,
    time: "10 mins ago",
    ai_reasoning: {
      Reason: "User deviated significantly from baseline downloads and initiated a mass copy to an unauthorized USB.",
      Evidence: "20 file reads in /SourceCode, 1 USB insertion (KINGSTON_64GB).",
      MITRE: "T1052.001 - Exfiltration Over USB",
      Confidence: "92%"
    }
  }

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-8">Incident Response</h1>
      
      <div className="bg-dark border border-accent/50 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="text-accent" size={28} />
              <h2 className="text-2xl font-bold text-white">Mass Exfiltration Detected</h2>
              <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-semibold border border-accent/30">
                CRITICAL - Score: 85
              </span>
            </div>
            <p className="text-slate-400">Target: {alertData.user} • Time: {alertData.time}</p>
          </div>
          
          <div className="flex gap-3">
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-slate-700">
              Lock Workstation
            </button>
            <button className="bg-accent hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Isolate Endpoint
            </button>
          </div>
        </div>

        {/* Explainable AI Box */}
        <div className="bg-slate-900 border border-primary/30 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <BrainCircuit size={20} />
            <h3 className="font-bold text-lg">Gemini AI Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Reasoning</p>
              <p className="text-slate-200">{alertData.ai_reasoning.Reason}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Evidence</p>
              <p className="text-slate-200 font-mono text-sm">{alertData.ai_reasoning.Evidence}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">MITRE ATT&CK</p>
              <p className="text-blue-400 font-mono text-sm flex items-center gap-2">
                {alertData.ai_reasoning.MITRE} <ExternalLink size={14} />
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Confidence</p>
              <p className="text-green-400 font-bold">{alertData.ai_reasoning.Confidence}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
