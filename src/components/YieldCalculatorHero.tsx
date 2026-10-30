import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ArrowRight, ShieldCheck, Globe } from 'lucide-react';

const YieldCalculatorHero: React.FC = () => {
  const [depositAmount, setDepositAmount] = useState(1000);
  const [university, setUniversity] = useState('Leeds');
  const apy = 8.2;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

  const unis = [
    { id: 'Leeds', name: 'University of Leeds' },
    { id: 'Beckett', name: 'Leeds Beckett' },
    { id: 'Bradford', name: 'University of Bradford' },
    { id: 'Hudds', name: 'University of Huddersfield' },
    { id: 'Global', name: 'Other / Global' },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F8] text-[#1A1A1A]">
      <div className="container mx-auto px-6 py-16">
        
        {/* Regional to Global Badge */}
        <div className="flex justify-center mb-8">
          <span className="bg-[#E5E7EB] text-[#4B5563] px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" /> 
            {university === 'Global' ? 'Global Waitlist Active' : 'West Yorkshire Pilot: Live'}
          </span>
        </div>

        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            The global standard for <br/> 
            <span className="text-[#3B82F6]">yield-bearing deposits.</span>
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed max-w-2xl mx-auto">
            From West Yorkshire to the world. We turn stagnant rental capital into yield-bearing RWAs on Avalanche.
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-white border border-[#E5E7EB] rounded-3xl shadow-sm overflow-hidden grid md:grid-cols-2">
          <div className="p-10 border-b md:border-b-0 md:border-r border-[#E5E7EB]">
            <div className="mb-8">
              <label className="text-sm font-semibold uppercase tracking-widest text-[#9CA3AF] block mb-4">Select University</label>
              <select 
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E5E7EB] bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {unis.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#9CA3AF] mb-4">Your Deposit</h3>
            <div className="space-y-8">
              <div>
                <div className="text-4xl font-bold mb-4">{formatCurrency(depositAmount)}</div>
                <input
                  type="range"
                  min="400"
                  max="5000"
                  step="50"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
                />
              </div>
            </div>
          </div>

          <div className="p-10 bg-[#F9FAFB] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">Estimated Annual Yield</h3>
              <div className="text-6xl font-bold text-[#10B981] mb-2">
                +{formatCurrency((depositAmount * apy) / 100)}
              </div>
              <p className="text-[#6B7280]">Real-time RWA yield generated on-chain.</p>
            </div>

            <div className="mt-10">
              <Link
                to="/university-onboarding"
                className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#333] transition-all"
              >
                {university === 'Global' ? 'Join Global Waitlist' : 'Get Started in West Yorkshire'} 
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldCalculatorHero;