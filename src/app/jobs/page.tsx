'use client';

import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, Star, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { escrowXContractConfig } from '@/lib/contract';

// Mock Data (In a real app, fetch from The Graph or contract events)
const jobs = [
    {
        id: 1,
        title: 'Full Stack Smart Contract Developer',
        description: 'Looking for an expert to build a DeFi protocol on Polygon. Must have experience with Solidity and React.',
        price: '0.001', // Lowered for testing
        deliveryTime: '2 weeks',
        rating: 4.9,
        reviews: 12,
    },
    {
        id: 2,
        title: 'NFT Collection Generative Art',
        description: 'Need a designer to create 10k unique traits for an NFT collection. Sci-fi theme.',
        price: '0.005',
        deliveryTime: '1 week',
        rating: 5.0,
        reviews: 5,
    },
    {
        id: 3,
        title: 'Auditing Smart Contracts',
        description: 'Security audit for a staking contract. Comprehensive report required.',
        price: '0.01',
        deliveryTime: '5 days',
        rating: 4.8,
        reviews: 24,
    },
];

export default function JobsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [purchasingId, setPurchasingId] = useState<number | null>(null);
    const { isConnected } = useAccount();
    const [profile, setProfile] = useState<any | null>(null);

    const {
        writeContract,
        data: hash,
        isPending: isWritePending,
        error: writeError
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    // Reset state after success
    if (isConfirmed && purchasingId) {
        setPurchasingId(null);
        alert("Escrow created successfully! Work can now begin.");
    }

    const handleHire = (job: typeof jobs[0]) => {
        if (!isConnected) {
            alert("Please connect your wallet first.");
            return;
        }

        setPurchasingId(job.id);

        writeContract({
            ...escrowXContractConfig,
            functionName: 'createEscrow',
            args: [BigInt(job.id)],
            value: parseEther(job.price),
        });
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const SKILLS = ['Solidity','React','Next.js','Wagmi','Viem','The Graph','Design','Testing','Security','AI/ML','Rust'];
    function extractSkills(text: string) {
        const lower = text.toLowerCase();
        return SKILLS.filter(s => lower.includes(s.toLowerCase()));
    }
    function matchScore(job: typeof jobs[0], prof: any): number {
        const jobSkills = extractSkills(job.description + ' ' + job.title);
        const profSkills = prof?.skills || [];
        const overlap = jobSkills.filter((s) => profSkills.includes(s)).length;
        const skillScore = Math.round((overlap / Math.max(1, profSkills.length)) * 80);
        const rate = parseFloat(prof?.hourlyRate || '0');
        const budget = parseFloat(job.price);
        const budgetFit = rate ? (rate <= budget * 1000 ? 20 : 5) : 10; // rough heuristic
        return Math.min(100, skillScore + budgetFit);
    }

    useEffect(() => {
        try {
            const p = localStorage.getItem('profile_published');
            if (p) setProfile(JSON.parse(p));
        } catch {}
    }, []);

    return (
        <div className="min-h-screen flex flex-col relative">
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-accent/5 blur-[100px] pointer-events-none" />

            <Navbar />

            <main className="flex-1 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-4xl font-bold mb-2">Find Work</h1>
                        <p className="text-muted-foreground">
                            Browse decentralized freelance opportunities.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-2 w-full md:w-auto"
                    >
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search for services..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <a href="/profile">
                            <Button className="bg-primary text-white hover:bg-primary/90">
                                Add Profile
                            </Button>
                        </a>
                    </motion.div>
                </div>

                {profile && (
                    <div className="mb-8">
                        <h3 className="text-xl font-bold mb-3">Recommended for You</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredJobs
                                .map((j) => ({ j, score: matchScore(j, profile) }))
                                .filter(({ score }) => score >= 80)
                                .slice(0, 3)
                                .map(({ j, score }) => (
                                    <Card key={`rec-${j.id}`} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">{j.title}</div>
                                            <div className="text-sm font-bold">{score}% match</div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{j.description}</p>
                                    </Card>
                                ))}
                        </div>
                    </div>
                )}

                {writeError && (
                    <div className="mb-8 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 rounded-lg text-sm text-center max-w-md mx-auto">
                        {(() => {
                            const msg = writeError.message?.toLowerCase() || '';
                            if (msg.includes('user rejected') || msg.includes('user denied')) {
                                return "Transaction incomplete due to user rejection.";
                            }
                            if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) {
                                return "Transaction incomplete due to insufficient funds.";
                            }
                            return "Transaction incomplete.";
                        })()}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job, index) => (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="h-full flex flex-col hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden">
                                {purchasingId === job.id && (isWritePending || isConfirming) && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                        <p className="font-bold text-white">
                                            {isConfirming ? 'Confirming Escrow...' : 'Check Wallet...'}
                                        </p>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold">
                                            Service #{job.id}
                                        </div>
                                        <div className="flex items-center text-yellow-500 text-xs font-bold gap-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            {job.rating} ({job.reviews})
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
                                        {job.title}
                                    </h3>
                                </div>

                                <p className="text-muted-foreground text-sm mb-6 flex-1 line-clamp-3">
                                    {job.description}
                                </p>

                                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        {job.deliveryTime}
                                    </div>
                                    <div className="text-lg font-bold">
                                        {job.price} <span className="text-xs text-muted-foreground">MATIC</span>
                                    </div>
                                </div>
                                <Button
                                    className="w-full mt-4 bg-white/5 hover:bg-primary hover:text-white border-white/10"
                                    variant="outline"
                                    onClick={() => handleHire(job)}
                                    disabled={purchasingId !== null}
                                >
                                    Hire Now (Escrow)
                                </Button>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {filteredJobs.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        No services found matching your search.
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
