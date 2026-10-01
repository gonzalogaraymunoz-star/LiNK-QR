import React, { useState, useEffect, useCallback } from 'react';
import {
  NavigationSection,
  Person,
  DashboardMetrics,
  QrEvent,
} from './types/index.ts';
import {
  getAllPersons,
  getDashboardMetrics,
  getAllActivity,
} from './services/identityService.ts';
import { Navigation } from './components/Navigation.tsx';
import { ResumenView } from './components/ResumenView.tsx';
import { PersonasView } from './components/PersonasView.tsx';
import { GeneradorQrView } from './components/GeneradorQrView.tsx';
import { EscanerInternoView } from './components/EscanerInternoView.tsx';
import { ActividadView } from './components/ActividadView.tsx';
import { ConfiguracionView } from './components/ConfiguracionView.tsx';
import { FichaPersonaModal } from './components/FichaPersonaModal.tsx';

export default function App() {
  const [currentSection, setCurrentSection] = useState<NavigationSection>('resumen');
  const [persons, setPersons] = useState<Person[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPersonas: 0,
    qrGenerados: 0,
    qrActivos: 0,
    qrInactivos: 0,
    escaneosRegistrados: 0,
    personasConActividad: 0,
  });
  const [events, setEvents] = useState<QrEvent[]>([]);
  const [selectedPersonForFicha, setSelectedPersonForFicha] = useState<Person | null>(null);
  const [isCreatePersonModalOpen, setIsCreatePersonModalOpen] = useState(false);
  const [preselectedPersonIdForGenerator, setPreselectedPersonIdForGenerator] = useState<string | null>(null);
  const [tokenForScanner, setTokenForScanner] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      const [personsData, metricsData, eventsData] = await Promise.all([
        getAllPersons(),
        getDashboardMetrics(),
        getAllActivity(),
      ]);
      setPersons(personsData);
      setMetrics(metricsData);
      setEvents(eventsData);

      // If a person is currently viewed in Ficha 360, update its local copy
      if (selectedPersonForFicha) {
        const updated = personsData.find((p) => p.id === selectedPersonForFicha.id);
        if (updated) setSelectedPersonForFicha(updated);
      }
    } catch (err) {
      console.error('Error loading LINK OS data:', err);
    }
  }, [selectedPersonForFicha]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Operational navigation actions
  const handleOpenFicha = (person: Person) => {
    setSelectedPersonForFicha(person);
  };

  const handleSelectPersonById = (personId: string) => {
    const person = persons.find((p) => p.id === personId);
    if (person) {
      setSelectedPersonForFicha(person);
    }
  };

  const handleNavigateToGeneratorForPerson = (personId: string) => {
    setPreselectedPersonIdForGenerator(personId);
    setCurrentSection('generador');
  };

  const handleNavigateToScannerWithToken = (token: string) => {
    setTokenForScanner(token);
    setCurrentSection('escaner');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f0e6] text-[#11120f]">
      {/* Top Header & Navigation */}
      <Navigation
        currentSection={currentSection}
        onSelectSection={(sec) => setCurrentSection(sec)}
        metricsSummary={{
          totalPersonas: metrics.totalPersonas,
          qrActivos: metrics.qrActivos,
          escaneos: metrics.escaneosRegistrados,
        }}
      />

      {/* Main Administrative Workplace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentSection === 'resumen' && (
          <ResumenView
            metrics={metrics}
            recentEvents={events}
            onNavigate={(sec) => setCurrentSection(sec)}
            onOpenCreatePerson={() => setIsCreatePersonModalOpen(true)}
            onSelectPersonById={handleSelectPersonById}
          />
        )}

        {currentSection === 'personas' && (
          <PersonasView
            persons={persons}
            onRefresh={loadAllData}
            onOpenFicha={handleOpenFicha}
            onNavigateToGeneratorForPerson={handleNavigateToGeneratorForPerson}
            isCreateModalOpen={isCreatePersonModalOpen}
            onCloseCreateModal={() => setIsCreatePersonModalOpen(false)}
            onOpenCreateModal={() => setIsCreatePersonModalOpen(true)}
          />
        )}

        {currentSection === 'generador' && (
          <GeneradorQrView
            persons={persons}
            preselectedPersonId={preselectedPersonIdForGenerator}
            onRefresh={loadAllData}
            onOpenFicha={handleOpenFicha}
          />
        )}

        {currentSection === 'escaner' && (
          <EscanerInternoView
            initialToken={tokenForScanner}
            onOpenFicha={handleOpenFicha}
            onRefresh={loadAllData}
          />
        )}

        {currentSection === 'actividad' && (
          <ActividadView
            events={events}
            persons={persons}
            onOpenFicha={handleOpenFicha}
          />
        )}

        {currentSection === 'configuracion' && (
          <ConfiguracionView onRefreshAll={loadAllData} />
        )}
      </main>

      {/* Ficha 360 Administrativa (Modal) */}
      {selectedPersonForFicha && (
        <FichaPersonaModal
          person={selectedPersonForFicha}
          onClose={() => setSelectedPersonForFicha(null)}
          onRefresh={loadAllData}
          onNavigateToScannerWithToken={handleNavigateToScannerWithToken}
        />
      )}

      {/* Footer strictly for LINK OS Internal Admin */}
      <footer className="border-t border-[#e9e2d3] bg-[#fffdf7] py-4 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#66685f]">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#11120f]">LINK OS QR</span>
            <span>•</span>
            <span>Centro de Control de Identidades y Comportamiento</span>
            <span>•</span>
            <span className="font-mono bg-[#e9e2d3] text-[#11120f] px-1.5 py-0.2 rounded font-semibold">
              v2.4.0-admin
            </span>
          </div>
          <div className="font-mono flex items-center gap-3">
            <span>Supabase Shared Identity Core</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
              Operador Autenticado
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
