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
import { useEffect, useState } from 'react';
import { uploadFilesToIPFS, uploadJSONToIPFS } from '@/lib/ipfs';
import { Upload, Eye, CheckCircle2 } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(6, 'Phone required'),
  countryCode: z.string().min(1, 'Country code required'),
  bio: z.string().min(50, 'Bio must be 50-500 characters').max(500),
  primaryOccupation: z.string().min(2, 'Primary occupation required'),
  secondaryOccupation: z.string().optional(),
  yearsExperience: z.string().regex(/^\d+$/, 'Years must be a number'),
  hourlyRate: z.string().regex(/^\d+(\.\d{1,18})?$/, 'Invalid amount'),
  rateCurrency: z.enum(['USD','EUR','ETH','MATIC','USDC']),
  availability: z.enum(['Available','Busy','On Leave']),
  skills: z.array(z.string()).min(3, 'Select at least 3 skills'),
  languages: z.array(z.string()).min(1, 'Add languages'),
  certifications: z.any().optional(),
  workHistory: z.array(z.object({
    name: z.string().min(2),
    role: z.string().min(2),
    start: z.string().min(1),
    end: z.string().min(1),
    description: z.string().min(10),
    skillsUsed: z.array(z.string()).optional(),
    link: z.string().url().optional(),
  })),
  portfolioFiles: z.any().optional(),
  profilePicture: z.any().optional(),
  visibility: z.enum(['Public','Private']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const SKILLS = ['Solidity','React','Next.js','Wagmi','Viem','The Graph','Design','Testing','Security','AI/ML'];
const LANGS = ['English','Spanish','French','German','Chinese','Hindi'];

export default function ProfilePage() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [attErr, setAttErr] = useState<string | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      rateCurrency: 'USD',
      availability: 'Available',
      visibility: 'Public',
      workHistory: [],
      skills: [],
      languages: [],
    },
  });

  useEffect(() => {
    const draft = localStorage.getItem('profile_draft');
    if (draft) { try { reset(JSON.parse(draft)); } catch {} }
  }, [reset]);
  useEffect(() => {
    const sub = watch((v) => localStorage.setItem('profile_draft', JSON.stringify(v)));
    return () => sub.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: ProfileFormValues) => {
    setAttErr(null);
    const certFiles: File[] = [];
    const pfFiles: File[] = [];
    const profilePic: File[] = [];
    const certList = (data.certifications as unknown as FileList) || ({} as FileList);
    const pList = (data.portfolioFiles as unknown as FileList) || ({} as FileList);
    const picList = (data.profilePicture as unknown as FileList) || ({} as FileList);
    const checkSize = (f: File, maxMB: number) => f.size <= maxMB * 1024 * 1024;
    for (let i = 0; i < (certList?.length || 0); i++) {
      const f = certList.item(i)!;
      if (!checkSize(f, 5)) { setAttErr('Certification exceeds 5MB'); return; }
      certFiles.push(f);
    }
    for (let i = 0; i < (pList?.length || 0); i++) {
      const f = pList.item(i)!;
      if (!checkSize(f, 5)) { setAttErr('Portfolio file exceeds 5MB'); return; }
      pfFiles.push(f);
    }
    if (picList?.length) {
      const f = picList.item(0)!;
      if (!checkSize(f, 5)) { setAttErr('Profile picture exceeds 5MB'); return; }
      profilePic.push(f);
    }
    try {
      const certCid = certFiles.length ? await uploadFilesToIPFS(certFiles) : null;
      const portCid = pfFiles.length ? await uploadFilesToIPFS(pfFiles.slice(0, 10)) : null;
      const picCid = profilePic.length ? await uploadFilesToIPFS(profilePic) : null;
      const doc = { profile: data, certCid: certCid?.cid ?? null, portCid: portCid?.cid ?? null, picCid: picCid?.cid ?? null, createdAt: new Date().toISOString() };
      const json = await uploadJSONToIPFS(doc);
      setIpfsUrl(json.url);
      setIsSuccess(true);
      localStorage.removeItem('profile_draft');
      localStorage.setItem('profile_published', JSON.stringify({ ...data, ipfs: json.url }));
    } catch (e: any) {
      alert(e.message || 'Failed to publish profile');
    }
  };

  const profile = watch();

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-primary/5 blur-[100px] pointer-events-none" />
      <Navbar />
      <main className="flex-1 py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile Management</h1>
          <p className="text-muted-foreground">Create or update your professional profile. Drafts auto-save locally.</p>
        </motion.div>

        {isSuccess ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Profile Published!</h2>
            {ipfsUrl && (
              <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mb-8 block">
                View IPFS Document
              </a>
            )}
            <div className="flex justify-center gap-4">
              <a href="/jobs"><Button>Back to Find Work</Button></a>
              <Button variant="outline" onClick={() => setIsSuccess(false)}>Update Profile</Button>
            </div>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input {...register('displayName')} />
                  {errors.displayName && <p className="text-red-500 text-xs">{errors.displayName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email (verified)</Label>
                  <Input type="email" {...register('email')} />
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Country Code</Label>
                  <Input placeholder="+1" {...register('countryCode')} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Phone Number</Label>
                  <Input {...register('phone')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea className="min-h-[120px]" {...register('bio')} placeholder="Summarize your experience, strengths, and interests..." />
                {errors.bio && <p className="text-red-500 text-xs">{errors.bio.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Primary Occupation</Label>
                  <Input {...register('primaryOccupation')} />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Occupation (optional)</Label>
                  <Input {...register('secondaryOccupation')} />
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input type="number" {...register('yearsExperience')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Hourly Rate</Label>
                  <Input placeholder="0.00" {...register('hourlyRate')} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-md p-2" {...register('rateCurrency')}>
                    {(['USD','EUR','ETH','MATIC','USDC'] as const).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Availability</Label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-md p-2" {...register('availability')}>
                    {(['Available','Busy','On Leave'] as const).map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills (min 3)</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((s) => {
                    const checked = (watch('skills') || []).includes(s);
                    return (
                      <label key={s} className={`px-3 py-1 rounded border cursor-pointer ${checked ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10'}`}>
                        <input type="checkbox" value={s} className="hidden" {...register('skills')} />
                        {s}
                      </label>
                    );
                  })}
                </div>
                {errors.skills && <p className="text-red-500 text-xs">{errors.skills.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label>Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGS.map((l) => {
                    const checked = (watch('languages') || []).includes(l);
                    return (
                      <label key={l} className={`px-3 py-1 rounded border cursor-pointer ${checked ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10'}`}>
                        <input type="checkbox" value={l} className="hidden" {...register('languages')} />
                        {l}
                      </label>
                    );
                  })}
                </div>
                {errors.languages && <p className="text-red-500 text-xs">{errors.languages.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label>Certifications (5MB max each)</Label>
                <Input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" {...register('certifications')} />
              </div>

              <div className="space-y-4">
                <Label>Work History</Label>
                <Button type="button" variant="outline" onClick={() => {
                  const current = watch('workHistory') || [];
                  const next = [...current, { name: '', role: '', start: '', end: '', description: '', skillsUsed: [], link: '' }];
                  (profile as any).workHistory = next;
                  reset(profile);
                }}>Add Another</Button>
                {(watch('workHistory') || []).map((w, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-white/10 rounded-md p-4">
                    <div className="space-y-2">
                      <Label>Project/Company</Label>
                      <Input {...register(`workHistory.${idx}.name` as const)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input {...register(`workHistory.${idx}.role` as const)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration Start</Label>
                      <Input type="date" {...register(`workHistory.${idx}.start` as const)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration End</Label>
                      <Input type="date" {...register(`workHistory.${idx}.end` as const)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea {...register(`workHistory.${idx}.description` as const)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Project Link</Label>
                      <Input {...register(`workHistory.${idx}.link` as const)} placeholder="https://..." />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Portfolio (max 10 files, 5MB each)</Label>
                <Input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" {...register('portfolioFiles')} />
                {attErr && <p className="text-yellow-500 text-xs">{attErr}</p>}
              </div>

              <div className="space-y-2">
                <Label>Profile Picture (5MB max)</Label>
                <Input type="file" accept=".png,.jpg,.jpeg,.webp" {...register('profilePicture')} />
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <select className="w-full bg-white/5 border border-white/10 rounded-md p-2" {...register('visibility')}>
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
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
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{profile.displayName || 'Unnamed'}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {profile.primaryOccupation} {profile.secondaryOccupation ? `• ${profile.secondaryOccupation}` : ''} • {profile.yearsExperience} yrs • {profile.availability}
                  </p>
                  <p className="mb-4 whitespace-pre-wrap">{profile.bio}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(profile.skills || []).map((s) => <span key={s} className="px-2 py-1 text-xs rounded bg-white/10">{s}</span>)}
                  </div>
                  <div className="text-sm">
                    Rate: {profile.hourlyRate} {profile.rateCurrency}
                  </div>
                </Card>
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
