'use client';

import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, Star, Loader2, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { escrowXContractConfig } from '@/lib/contract';
import Link from 'next/link';

// Mock Data (Same as Jobs Page but reframed as Talent)
const services = [
    {
        id: 1,
        title: 'Full Stack Smart Contract Developer',
        description: 'Looking for a DeFi protocol on Polygon? I have experience with Solidity, React, and The Graph.',
        price: '0.001',
        deliveryTime: '2 weeks',
        rating: 4.9,
        reviews: 12,
        freelancer: '0x123...456'
    },
    {
        id: 2,
        title: 'NFT Collection Generative Art',
        description: 'I will create 10k unique traits for your NFT collection. Sci-fi, Cyberpunk, and Anime themes available.',
        price: '0.005',
        deliveryTime: '1 week',
        rating: 5.0,
        reviews: 5,
        freelancer: '0xabc...def'
    },
    {
        id: 3,
        title: 'Auditing Smart Contracts',
        description: 'Professional security audit for your staking or token contract. Comprehensive PDF report included.',
        price: '0.01',
        deliveryTime: '5 days',
        rating: 4.8,
        reviews: 24,
        freelancer: '0x789...012'
    },
    {
        id: 4,
        title: 'Web3 Frontend with Wagmi',
        description: 'I build responsive dApp frontends using Next.js and Tailwind. Seamless wallet connection guaranteed.',
        price: '0.008',
        deliveryTime: '10 days',
        rating: 4.7,
        reviews: 8,
        freelancer: '0xde4...556'
    },
    {
        id: 5,
        title: 'Community Manager for DAO',
        description: 'I will manage your Discord and Twitter. Engage community, moderate chats, and run events.',
        price: '0.002',
        deliveryTime: '1 month',
        rating: 4.5,
        reviews: 2,
        freelancer: '0x999...888'
    },
    {
        id: 6,
        title: 'Solidity Tutor',
        description: 'Learn Solidity and writing secure smart contracts. 1-on-1 Zoom sessions.',
        price: '0.0005',
        deliveryTime: '1 hour',
        rating: 5.0,
        reviews: 15,
        freelancer: '0x444...333'
    }
];

export default function TalentPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [purchasingId, setPurchasingId] = useState<number | null>(null);
    const { isConnected } = useAccount();

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

    const handleHire = (service: typeof services[0]) => {
        if (!isConnected) {
            alert("Please connect your wallet first.");
            return;
        }

        setPurchasingId(service.id);

        writeContract({
            ...escrowXContractConfig,
            functionName: 'createEscrow',
            args: [BigInt(service.id)],
            value: parseEther(service.price),
        });
    };

    const filteredServices = services.filter(service =>
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <h1 className="text-4xl font-bold mb-2">Hire Top Talent</h1>
                        <p className="text-muted-foreground">
                            Discover and hire the best freelancers in Web3. Trustless & Fee-less.
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
                                placeholder="Search skills, services..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Link href="/post-job">
                            <Button className="bg-primary text-white hover:bg-primary/90">
                                Post a Job
                            </Button>
                        </Link>
                    </motion.div>
                </div>

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
                    {filteredServices.map((service, index) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="h-full flex flex-col hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden">
                                {purchasingId === service.id && (isWritePending || isConfirming) && (
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
                                            {service.freelancer}
                                        </div>
                                        <div className="flex items-center text-yellow-500 text-xs font-bold gap-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            {service.rating} ({service.reviews})
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
                                        {service.title}
                                    </h3>
                                </div>

                                <p className="text-muted-foreground text-sm mb-6 flex-1 line-clamp-3">
                                    {service.description}
                                </p>

                                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        {service.deliveryTime}
                                    </div>
                                    <div className="text-lg font-bold">
                                        {service.price} <span className="text-xs text-muted-foreground">MATIC</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <Link href="/messages" className="flex-1">
                                        <Button
                                            variant="outline"
                                            className="w-full bg-white/5 hover:bg-white/10 border-white/10"
                                            disabled={purchasingId !== null}
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Chat
                                        </Button>
                                    </Link>
                                    <Button
                                        className="flex-1" // Primary gradient style from Button component
                                        onClick={() => handleHire(service)}
                                        disabled={purchasingId !== null}
                                    >
                                        Hire
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {filteredServices.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        No services found matching your search.
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
