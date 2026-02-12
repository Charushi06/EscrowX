'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, Upload } from 'lucide-react';
import { uploadFilesToIPFS, uploadJSONToIPFS } from '@/lib/ipfs';

const jobSchema = z.object({
  title: z.string().min(3, 'Job title is required'),
  description: z.string().min(100, 'Description must be at least 100 characters'),
  category: z.string().min(1, 'Select a category'),
  experience: z.enum(['Entry', 'Mid', 'Senior', 'Expert']),
  skills: z.array(z.string()).min(1, 'Select at least one skill'),
  budgetMin: z.string().regex(/^\d+(\.\d{1,18})?$/, 'Invalid amount'),
  budgetMax: z.string().regex(/^\d+(\.\d{1,18})?$/, 'Invalid amount'),
  currency: z.enum(['USD', 'EUR', 'ETH', 'MATIC', 'USDC']),
  durationType: z.enum(['days', 'weeks', 'date']),
  durationValue: z.string().min(1, 'Provide duration'),
  workType: z.enum(['Full-time', 'Part-time', 'Contract', 'Hourly']),
  locationPref: z.enum(['Remote', 'On-site', 'Hybrid']),
  location: z.string().optional(),
  deadline: z.string().min(1, 'Deadline is required'),
  contactMethod: z.enum(['Wallet DM', 'Email', 'Phone']),
  attachments: z.any().optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

const SKILLS = [
  'Solidity', 'React', 'Next.js', 'Wagmi', 'Viem', 'The Graph',
  'Ethers', 'Hardhat', 'UI/UX', 'Rust', 'Substrate', 'Design',
  'DevOps', 'Testing', 'Security', 'AI/ML'
];
const CATEGORIES = [
  'Smart Contracts', 'Frontend dApps', 'Audits', 'NFT/Metaverse', 'DeFi', 'DAO', 'AI'
];

export default function PostJobPage() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [attErr, setAttErr] = useState<string | null>(null);
  const [lastJob, setLastJob] = useState<JobFormValues | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      currency: 'USD',
      experience: 'Entry',
      durationType: 'days',
      workType: 'Contract',
      locationPref: 'Remote',
      skills: [],
      category: '',
      contactMethod: 'Wallet DM',
    },
  });

  const desc = watch('description') || '';
  const selectedSkills = watch('skills') || [];
  const durationType = watch('durationType');

  useEffect(() => {
    const draft = localStorage.getItem('post_job_draft');
    if (draft) {
      try { reset(JSON.parse(draft)); } catch {}
    }
  }, [reset]);
  useEffect(() => {
    const sub = watch((values) => {
      localStorage.setItem('post_job_draft', JSON.stringify(values));
    });
    return () => sub.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: JobFormValues) => {
    setAttErr(null);
    const files: File[] = [];
    const input = (data.attachments as unknown as FileList) || ({} as FileList);
    for (let i = 0; i < (input?.length || 0); i++) {
      const f = input.item(i)!;
      if (f.size > 10 * 1024 * 1024) {
        setAttErr('Attachment exceeds 10MB limit');
        return;
      }
      files.push(f);
    }
    try {
      const jobDoc = {
        ...data,
        createdAt: new Date().toISOString(),
      };
      const uploaded = files.length > 0 ? await uploadFilesToIPFS(files) : null;
      const json = await uploadJSONToIPFS({
        job: jobDoc,
        attachmentsCid: uploaded?.cid ?? null,
      });
      setIpfsUrl(json.url);
      setLastJob(data);
      setIsSuccess(true);
      localStorage.removeItem('post_job_draft');
      reset();
    } catch (e: any) {
      alert(e.message || 'Failed to publish job');
    }
  };

  const Preview = () => {
    const values = watch();
    return (
      <Card className="p-6">
        <h3 className="text-2xl font-bold mb-2">{values.title || 'Untitled Job'}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {values.category} • {values.experience} • {values.workType}
        </p>
        <p className="whitespace-pre-wrap mb-4">{values.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {values.skills?.map((s) => (
            <span key={s} className="px-2 py-1 text-xs rounded bg-white/10">{s}</span>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Budget:</span> {values.budgetMin}–{values.budgetMax} {values.currency}
          </div>
          <div>
            <span className="font-semibold">Duration:</span> {values.durationValue} {values.durationType}
          </div>
          <div>
            <span className="font-semibold">Location:</span> {values.locationPref}{values.location ? ` • ${values.location}` : ''}
          </div>
          <div>
            <span className="font-semibold">Deadline:</span> {values.deadline}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-primary/5 blur-[100px] pointer-events-none" />
      <Navbar />
      <main className="flex-1 py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Post a Job</h1>
          <p className="text-muted-foreground">Create a comprehensive job posting. Data is stored on IPFS.</p>
        </motion.div>

        {isSuccess ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Job Posted Successfully!</h2>
            {ipfsUrl && (
              <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mb-8 block">
                View IPFS Document
              </a>
            )}
            {lastJob && (
              <div className="text-left max-w-2xl mx-auto mb-8">
                <h3 className="text-xl font-bold mb-3">Top Matches</h3>
                <div className="space-y-3">
                  {getTopMatches(lastJob).map((m) => (
                    <div key={m.title} className="flex items-center justify-between border border-white/10 rounded-md p-3">
                      <div>
                        <div className="font-semibold">{m.title}</div>
                        <div className="text-xs text-muted-foreground">{m.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{m.score}% match</div>
                        <a href="/talent"><Button variant="outline" className="mt-2">View</Button></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Button onClick={() => setIsSuccess(false)} variant="outline">Post Another</Button>
              <Button asChild>
                <a href="/talent">Find Top Matches</a>
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" {...register('title')} placeholder="e.g. Senior Solidity Engineer" />
                {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea id="description" className="min-h-[200px]" {...register('description')} placeholder="Describe the role, responsibilities, and requirements..." />
                <div className="text-xs text-muted-foreground text-right">{desc.length}/5000</div>
                {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Category/Industry</Label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-md p-2" {...register('category')}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-md p-2" {...register('experience')}>
                    {(['Entry','Mid','Senior','Expert'] as const).map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills Required</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((s) => {
                    const checked = selectedSkills.includes(s);
                    return (
                      <label key={s} className={`px-3 py-1 rounded border cursor-pointer ${checked ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10'}`}>
                        <input
                          type="checkbox"
                          value={s}
                          className="hidden"
                          {...register('skills')}
                        />
                        {s}
                      </label>
                    );
                  })}
                </div>
                {errors.skills && <p className="text-red-500 text-xs">{errors.skills.message as string}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Budget Range (Min)</Label>
                  <Input placeholder="0.00" {...register('budgetMin')} />
                  {errors.budgetMin && <p className="text-red-500 text-xs">{errors.budgetMin.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Budget Range (Max)</Label>
                  <Input placeholder="0.00" {...register('budgetMax')} />
                  {errors.budgetMax && <p className="text-red-500 text-xs">{errors.budgetMax.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-md p-2" {...register('currency')}>
                    {(['USD','EUR','ETH','MATIC','USDC'] as const).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Project Duration</Label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-md p-2" {...register('durationType')}>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="date">Until Date</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{durationType === 'date' ? 'End Date' : 'Value'}</Label>
                  <Input type={durationType === 'date' ? 'date' : 'number'} {...register('durationValue')} />
                </div>
                <div className="space-y-2">
                  <Label>Work Type</Label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-md p-2" {...register('workType')}>
                    {(['Full-time','Part-time','Contract','Hourly'] as const).map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Location Preference</Label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-md p-2" {...register('locationPref')}>
                    {(['Remote','On-site','Hybrid'] as const).map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Location (optional)</Label>
                  <Input placeholder="City, Country" {...register('location')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Application Deadline</Label>
                  <Input type="date" {...register('deadline')} />
                  {errors.deadline && <p className="text-red-500 text-xs">{errors.deadline.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Contact Method</Label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-md p-2" {...register('contactMethod')}>
                    {(['Wallet DM','Email','Phone'] as const).map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attachments (max 10MB each)</Label>
                <Input type="file" multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" {...register('attachments')} />
                {attErr && <p className="text-yellow-500 text-xs">{attErr}</p>}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
                  <Eye className="w-4 h-4 mr-2" /> Preview
                </Button>
                <Button type="submit" className="flex-1">
                  <Upload className="w-4 h-4 mr-2" /> Publish to IPFS
                </Button>
              </div>
            </form>
          </Card>
        )}

        <AnimatePresence>
          {previewOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="max-w-2xl w-full">
                <Preview />
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

type ServiceMock = { title: string; description: string; skills: string[]; experience: 'Entry'|'Mid'|'Senior'|'Expert'; priceMin: number; priceMax: number; remote: boolean };
const MOCK_SERVICES: ServiceMock[] = [
  { title: 'Solidity Engineer', description: 'Smart contract development and audits', skills: ['Solidity','Hardhat','Security'], experience: 'Senior', priceMin: 50, priceMax: 100, remote: true },
  { title: 'Web3 Frontend Dev', description: 'Next.js + Wagmi dApp UIs', skills: ['React','Next.js','Wagmi','Viem'], experience: 'Mid', priceMin: 35, priceMax: 70, remote: true },
  { title: 'DeFi Strategist', description: 'Tokenomics and protocol design', skills: ['AI/ML','Design','Security'], experience: 'Expert', priceMin: 80, priceMax: 150, remote: true },
];

function computeMatch(job: JobFormValues, service: ServiceMock): number {
  const skillOverlap = job.skills.filter((s) => service.skills.includes(s)).length;
  const skillScore = Math.min(100, Math.round((skillOverlap / Math.max(1, job.skills.length)) * 60));
  const expScore = job.experience === service.experience ? 20 : (['Entry','Mid','Senior','Expert'].indexOf(job.experience) <= ['Entry','Mid','Senior','Expert'].indexOf(service.experience) ? 10 : 5);
  const budgetMin = parseFloat(job.budgetMin || '0');
  const budgetMax = parseFloat(job.budgetMax || '0');
  const budgetFit = (service.priceMin >= budgetMin && service.priceMax <= budgetMax) ? 15 : 5;
  const remoteFit = job.locationPref === 'Remote' ? (service.remote ? 5 : 0) : 0;
  return Math.min(100, skillScore + expScore + budgetFit + remoteFit);
}

function getTopMatches(job: JobFormValues) {
  return MOCK_SERVICES
    .map((s) => ({ ...s, score: computeMatch(job, s) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
