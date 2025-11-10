'use client';

import React from 'react';
import Link from 'next/link';
import {
  HeartPulse, Syringe, Search, BookOpenText,
  CheckCircle2, Clock, Shield, Zap,
  MapPin, ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="px-4 md:px-8 pt-12 md:pt-16 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-neutral-50 to-neutral-100 dark:from-red-600/10 dark:via-neutral-900 dark:to-neutral-800" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 text-red-600 dark:bg-red-600/20 text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Trusted by 107+ Licensed Clinicians
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            One hub for protocols, checklists, and calculators — <span className="text-red-600">offline‑ready</span>
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-6">
            Designed for CCT and ALS/BLS teams with fast search, pediatric/OB pathways, and admin‑friendly updates. Access critical care protocols anywhere, anytime.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/protocols" className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-sm font-medium inline-flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20">
              Open Protocols
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="rounded-xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 px-6 py-3 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-sm">
              Download App
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 md:px-8 py-12 bg-white dark:bg-neutral-800 border-y dark:border-neutral-700">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <Stat number="107+" label="Licensed Clinicians" />
            <Stat number="44+" label="Certification Types" />
            <Stat number="3-State" label="Coverage Area" />
            <Stat number="24/7" label="Critical Care Ready" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need in the field</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Built specifically for critical care transport teams. Fast, reliable, and works offline.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={<BookOpenText className="h-6 w-6" />} title="Clinical Protocols" description="Browse by system with quick breadcrumbs, role-scoped detail, and version control." />
            <FeatureCard icon={<CheckCircle2 className="h-6 w-6" />} title="Smart Checklists" description="Airway, vent setup, transfusion, handoff procedures — never miss a step." />
            <FeatureCard icon={<Syringe className="h-6 w-6" />} title="Drug Calculators" description="Weight-based dosing, drip rates, RSI meds — accurate and fast." />
            <FeatureCard icon={<Search className="h-6 w-6" />} title="Instant Search" description="Find protocols, medications, and procedures in seconds, even offline." />
            <FeatureCard icon={<Clock className="h-6 w-6" />} title="Offline Ready" description="Full functionality without internet. Critical content always cached." />
            <FeatureCard icon={<Shield className="h-6 w-6" />} title="Audit Trail" description="Version control, review cycles, and compliance documentation built in." />
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Designed for real-world scenarios</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <UseCase title="Scene Response" description="Quick protocol access during initial assessment and stabilization." icon={<Zap className="h-8 w-8 text-amber-600" />} />
            <UseCase title="In-Flight Care" description="Continuous reference for interventions during helicopter transport." icon={<HeartPulse className="h-8 w-8 text-red-600" />} />
            <UseCase title="Interfacility Transfer" description="Detailed protocols for complex patients between facilities." icon={<MapPin className="h-8 w-8 text-blue-600" />} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-8 py-16 bg-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready for your next transport?</h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">Access protocols, calculators, and checklists — anywhere, anytime.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/protocols" className="bg-white text-red-600 px-8 py-3 rounded-xl font-semibold hover:bg-neutral-100 transition-colors inline-flex items-center gap-2">
              Open Protocols
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">Download App</button>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">{number}</div>
      <div className="text-sm text-neutral-600 dark:text-neutral-400">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 hover:shadow-lg transition-shadow">
      <div className="h-12 w-12 rounded-xl bg-red-600/10 dark:bg-red-600/20 flex items-center justify-center text-red-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
    </div>
  );
}

function UseCase({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
    </div>
  );
}
