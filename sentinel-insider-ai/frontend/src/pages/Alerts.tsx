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
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto" data-testid="alerts-page">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Incident Response</h1>
      </div>
      
      <div className="bg-surface border border-border p-6 rounded-lg relative overflow-hidden shadow-sm" data-testid="incident-card">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#D15C43]"></div>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="text-[#D15C43]" size={28} />
              <h2 className="text-2xl font-bold text-text-primary">Mass Exfiltration Detected</h2>
              <span className="bg-[#D15C43]/10 text-[#D15C43] px-3 py-1 rounded-full text-sm font-bold border border-[#D15C43]/20 uppercase tracking-wide">
                CRITICAL - Score: 85
              </span>
            </div>
            <p className="text-text-secondary font-medium">Target: <span className="text-text-primary font-bold">{alertData.user}</span> • Time: {alertData.time}</p>
          </div>
          
          <div className="flex gap-3">
            <button className="bg-surface border border-border hover:border-[#D4D2CC] hover:bg-sidebar text-text-primary px-4 py-2 rounded-lg font-bold transition-colors shadow-sm" data-testid="btn-lock-workstation">
              Lock Workstation
            </button>
            <button className="bg-[#D15C43] hover:bg-[#B84D35] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm" data-testid="btn-isolate-endpoint">
              Isolate Endpoint
            </button>
          </div>
        </div>

        {/* Explainable AI Box */}
        <div className="bg-background border border-border rounded-lg p-5 mb-2 shadow-inner" data-testid="ai-analysis-box">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <BrainCircuit size={20} />
            <h3 className="font-bold text-lg">Gemini AI Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="overline-label mb-1">Reasoning</p>
              <p className="text-text-primary">{alertData.ai_reasoning.Reason}</p>
            </div>
            <div>
              <p className="overline-label mb-1">Evidence</p>
              <p className="text-text-primary font-mono text-sm bg-surface p-2 rounded border border-border">{alertData.ai_reasoning.Evidence}</p>
            </div>
            <div>
              <p className="overline-label mb-1">MITRE ATT&CK</p>
              <p className="text-primary font-mono text-sm flex items-center gap-2 font-bold cursor-pointer hover:underline">
                {alertData.ai_reasoning.MITRE} <ExternalLink size={14} />
              </p>
            </div>
            <div>
              <p className="overline-label mb-1">Confidence</p>
              <p className="text-success font-bold text-lg">{alertData.ai_reasoning.Confidence}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
