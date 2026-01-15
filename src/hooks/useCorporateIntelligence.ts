import { useState, useEffect, useMemo } from 'react';
import { useEmployees } from './useEmployees';
import { useHotels } from './useHotels';
import { useStaffingRequests } from './useStaffingRequests';
import { useApplications } from './useApplications';
import { useAttendance } from './useAttendance';
import { useAdoptionStats } from './useAdoptionStats';
import { subDays, differenceInDays, differenceInHours } from 'date-fns';

export interface ReportSection {
  title: string;
  score?: number; // 0-100 score if applicable
  metrics: { label: string; value: string | number; status?: 'good' | 'warning' | 'critical' | 'neutral' }[];
  insights: { text: string; type: 'positive' | 'negative' | 'warning' | 'neutral' }[];
}

export interface HotelHealth {
  id: string;
  name: string;
  score: number; // Higher is worse (more pain)
  issues: string[];
  status: 'critical' | 'warning' | 'healthy';
}

export interface CorporateReport {
  accountHealth: { score: number; status: 'healthy' | 'risk' | 'critical'; message: string };
  talent: ReportSection;
  demand: ReportSection; // Solicitudes
  supply: ReportSection; // Aplicaciones
  visits: ReportSection; // Asistencia/Visitas
  workrecord: ReportSection;
  hotelHealth: HotelHealth[];
  loading: boolean;
}

export function useCorporateIntelligence() {
  const { employees, loading: loadingEmp } = useEmployees();
  const { hotels, loading: loadingHotels } = useHotels();
  const { activeRequests, allRequests, loading: loadingReq } = useStaffingRequests();
  const { applications, loading: loadingApps } = useApplications();
  const { stats: adoptionStats, loading: loadingAdoption } = useAdoptionStats();
  
  // For visits, we need to pass a date range. Let's look at last 30 days.
  const dateRange = useMemo(() => ({ start: subDays(new Date(), 30), end: new Date() }), []);
  const { filteredRecords: visits, loading: loadingVisits } = useAttendance(dateRange, undefined);

  const [report, setReport] = useState<CorporateReport | null>(null);

  useEffect(() => {
    // Safety checks for arrays
    const safeEmployees = employees || [];
    const safeHotelsRaw = hotels || [];
    const safeRequestsActive = activeRequests || [];
    const safeRequestsAll = allRequests || [];
    const safeApplications = applications || [];
    const safeStats = adoptionStats || [];
    const safeVisits = visits || [];

    // --- PRE-PROCESSING: Filter Active Hotels Only ---
    // Only consider hotels that have at least 1 active employee
    const activeEmployeeHotelIds = new Set(safeEmployees.filter(e => e.isActive).map(e => e.hotelId));
    const safeHotels = safeHotelsRaw.filter(h => activeEmployeeHotelIds.has(h.id));

    // ---------------------------------------------------------
    // 1. METRICS CALCULATION FOR SCORE
    // ---------------------------------------------------------
    
    // A. Talent Score
    const activeEmployees = safeEmployees.filter(e => e.isActive);
    const temporalEmployees = activeEmployees.filter(e => e.employeeType === 'temporal');
    const tempRatio = activeEmployees.length > 0 ? (temporalEmployees.length / activeEmployees.length) : 0;
    const talentScore = tempRatio <= 0.3 ? 25 : Math.max(0, 25 - ((tempRatio - 0.3) * 50)); // Penalty for high temp ratio

    // B. Response Score (Resolution Rate)
    const createdLast30 = safeRequestsAll.filter(r => differenceInDays(new Date(), new Date(r.created_at)) <= 30).length;
    const completedLast30 = safeRequestsAll.filter(r => 
        (r.status === 'Completada' || r.status === 'Completada Parcialmente') && 
        r.completed_at && 
        differenceInDays(new Date(), new Date(r.completed_at)) <= 30
    ).length;
    const resolutionRate = createdLast30 > 0 ? (completedLast30 / createdLast30) : 1; // 100% if no requests created
    const responseScore = Math.min(25, resolutionRate * 25);

    // C. Supervision Score (Visits Coverage)
    const visitedHotelIds = new Set(safeVisits.map(v => v.hotelId));
    // Verify coverage against ACTIVE hotels
    const coveragePercent = safeHotels.length > 0 ? (new Set(safeHotels.filter(h => visitedHotelIds.has(h.id))).size / safeHotels.length) : 1;
    const supervisionScore = coveragePercent * 25;

    // D. Discipline Score (Workrecord Compliance)
    const totalCompliance = safeStats.reduce((acc, stat) => acc + stat.compliancePercentage, 0);
    const avgCompliance = safeStats.length > 0 ? totalCompliance / safeStats.length : 0; // 0-100
    const disciplineScore = (avgCompliance / 100) * 25;

    // TOTAL SCORE
    let totalScore = Math.round(talentScore + responseScore + supervisionScore + disciplineScore);
    let healthStatus: 'healthy' | 'risk' | 'critical' = 'healthy';
    let healthMessage = "La cuenta opera con altos estándares de eficiencia.";

    if (totalScore < 60) {
        healthStatus = 'critical';
        healthMessage = "La cuenta requiere intervención inmediata en múltiples áreas.";
    } else if (totalScore < 80) {
        healthStatus = 'risk';
        healthMessage = "Operación estable pero con riesgos latentes en puntos clave.";
    }

    // ---------------------------------------------------------
    // SECTION GENERATION
    // ---------------------------------------------------------

    // --- 1. TALENT ANALYSIS ---
    const talentInsights = [];
    if (tempRatio > 0.3) {
        talentInsights.push({ text: `Alta dependencia de personal temporal (${(tempRatio*100).toFixed(0)}% de la plantilla).`, type: 'warning' as const });
    } else {
        talentInsights.push({ text: `Equilibrio saludable entre fijos y temporales (${((1-tempRatio)*100).toFixed(0)}% fijos).`, type: 'positive' as const });
    }
    
    const incompleteDocs = activeEmployees.filter(e => !e.documentacion_completa).length;
    if (incompleteDocs > 0) {
        talentInsights.push({ text: `Riesgo: ${incompleteDocs} empleados activos tienen documentación incompleta.`, type: 'negative' as const });
    }

    const talentSection: ReportSection = {
        title: "Talento y Estabilidad",
        metrics: [
            { label: "Plantilla Activa", value: activeEmployees.length, status: 'neutral' },
            { label: "Temporales", value: `${(tempRatio*100).toFixed(0)}%`, status: tempRatio > 0.4 ? 'warning' : 'good' },
            { label: "Hoteles Activos", value: safeHotels.length, status: 'neutral' }
        ],
        insights: talentInsights
    };


    // --- 2. DEMAND & FRICTION ANALYSIS ---
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentFrictionRequests = safeRequestsAll.filter(r => new Date(r.created_at) >= thirtyDaysAgo);

    // Focus on non-completed, non-archived requests for current open metrics
    const openRequests = safeRequestsActive.filter(r => r.status === 'Pendiente' || r.status === 'En Proceso' || r.status === 'Enviada a Reclutamiento');
    const criticalRequests = openRequests.filter(r => differenceInHours(new Date(), new Date(r.created_at)) > 24);
    
    // Friction Metrics (using last 30 days)
    const cancelledRequests = recentFrictionRequests.filter(r => r.status === 'Cancelada por Hotel').length;
    const noShowRequests = recentFrictionRequests.filter(r => r.status === 'Candidato No Presentado').length;
    const expiredRequests = recentFrictionRequests.filter(r => r.status === 'Vencida').length;
    
    const demandInsights = [];
    
    // Critical Open Requests
    if (criticalRequests.length > 0) {
        demandInsights.push({ text: `Urgencia: ${criticalRequests.length} solicitudes abiertas han superado las 24h sin cierre.`, type: 'negative' as const });
    }

    // Cancellation Analysis
    const totalRecentProcessed = recentFrictionRequests.length;
    if (totalRecentProcessed > 0 && cancelledRequests > 0) {
        const cancelRate = (cancelledRequests / totalRecentProcessed);
        if (cancelRate > 0.15) {
             demandInsights.push({ text: `Fricción (30d): Alta tasa de cancelación (${(cancelRate*100).toFixed(0)}%). Validar requisitos reales con hoteles.`, type: 'warning' as const });
        }
    }

    // Ghosting Analysis
    if (noShowRequests > 0) {
         demandInsights.push({ text: `Fiabilidad (30d): ${noShowRequests} casos de "Candidato No Presentado". Revisar proceso de confirmación.`, type: 'negative' as const });
    }

    // Expired Analysis
    if (expiredRequests > 0) {
         demandInsights.push({ text: `Pérdida (30d): ${expiredRequests} solicitudes vencieron sin cubrirse. Capacidad de respuesta excedida.`, type: 'warning' as const });
    }

    // Identify Hotel Hotspot
    const requestsByHotel: Record<string, number> = {};
    openRequests.forEach(r => {
        requestsByHotel[r.hotel_id] = (requestsByHotel[r.hotel_id] || 0) + 1;
    });
    
    const topHotelEntry = Object.entries(requestsByHotel).sort((a,b) => b[1] - a[1])[0];
    if (topHotelEntry && topHotelEntry[1] >= 2) { 
        const hotelName = safeHotels.find(h => h.id === topHotelEntry[0])?.name || 'Un Hotel';
        demandInsights.push({ 
            text: `Foco: "${hotelName}" concentra la mayor necesidad actual (${topHotelEntry[1]} vacantes).`, 
            type: 'neutral' as const 
        });
    }

    // Velocity Analysis
    const recentRequests = safeRequestsAll.filter(r => differenceInDays(new Date(), new Date(r.created_at)) <= 7).length;
    if (recentRequests >= 1) {
         demandInsights.push({ text: `Actividad: Entrada de ${recentRequests} nuevas solicitudes en los últimos 7 días.`, type: 'neutral' as const });
    }

    // Complexity Analysis
    const standardRoles = ['Housekeeper', 'Laundry Attendant', 'Houseman', 'Room Attendant'];
    const specializedRequests = openRequests.filter(r => !standardRoles.includes(r.role));
    
    if (openRequests.length > 0 && specializedRequests.length > 0) {
        const specializedRatio = specializedRequests.length / openRequests.length;
        if (specializedRatio > 0.3) {
             demandInsights.push({ 
                 text: `Desafío: El ${(specializedRatio * 100).toFixed(0)}% de vacantes activas son roles especializados.`, 
                 type: 'neutral' as const 
             });
        }
    }

    const demandSection: ReportSection = {
        title: "Demanda y Fricción Operativa",
        metrics: [
            { label: "Vacantes Activas", value: openRequests.length, status: openRequests.length > 5 ? 'warning' : 'good' },
            { label: "Críticas (>24h)", value: criticalRequests.length, status: criticalRequests.length > 0 ? 'critical' : 'good' },
            { label: "Canceladas/Vencidas", value: cancelledRequests + expiredRequests, status: (cancelledRequests + expiredRequests) > 5 ? 'warning' : 'neutral' }
        ],
        insights: demandInsights
    };

    // Resolution Rate Insight
    if (createdLast30 > 0) {
        const resRate = resolutionRate * 100;
        let rateType: 'positive' | 'warning' | 'negative' | 'neutral' = 'neutral';
        if (resRate >= 80) rateType = 'positive';
        else if (resRate < 50) rateType = 'warning';
        
        demandSection.insights.unshift({ 
            text: `Eficacia (30d): Has resuelto el ${resRate.toFixed(0)}% de las necesidades surgidas este mes (${completedLast30}/${createdLast30}).`,
            type: rateType
        });
    }


    // --- 3. SUPPLY & HIRING PRODUCTIVITY ---
    const recentApplications = safeApplications.filter(a => differenceInDays(new Date(), new Date(a.created_at)) <= 30);
    const weeklyApplications = safeApplications.filter(a => differenceInDays(new Date(), new Date(a.created_at)) <= 7);
    
    const supplyInsights = [];

    // Hiring Velocity
    if (weeklyApplications.length > 0) {
        supplyInsights.push({ text: `Productividad: Has procesado ${weeklyApplications.length} nuevos ingresos esta semana.`, type: 'positive' as const });
    } else {
        supplyInsights.push({ text: `Sin actividad reciente: No se han registrado ingresos en los últimos 7 días.`, type: 'neutral' as const });
    }

    // Top Hiring Hotel
    if (recentApplications.length > 0) {
        const appsByHotel: Record<string, number> = {};
        recentApplications.forEach(a => {
            appsByHotel[a.hotel_id] = (appsByHotel[a.hotel_id] || 0) + 1;
        });
        const topHiringHotel = Object.entries(appsByHotel).sort((a,b) => b[1] - a[1])[0];
        
        if (topHiringHotel) {
            const hName = safeHotels.find(h => h.id === topHiringHotel[0])?.name || 'Un Hotel';
            supplyInsights.push({ text: `Crecimiento: "${hName}" lidera los ingresos con ${topHiringHotel[1]} contrataciones este mes.`, type: 'neutral' as const });
        }
    }

    // Role/Mix Analysis
    if (recentApplications.length > 0) {
        const roles = recentApplications.map(a => a.role);
        const uniqueRoles = new Set(roles);
        if (uniqueRoles.size > 3) {
             supplyInsights.push({ text: `Diversificación: Estás contratando para ${uniqueRoles.size} roles distintos este mes.`, type: 'neutral' as const });
        } else if (roles.length >= 3 && uniqueRoles.size === 1) {
             supplyInsights.push({ text: `Concentración: El 100% de los ingresos recientes son para "${roles[0]}".`, type: 'neutral' as const });
        }
    }

    // Pending Applications
    const pendingApps = safeApplications.filter(a => a.status === 'pendiente');
    if (pendingApps.length > 0) {
        supplyInsights.push({ text: `Pendientes: ${pendingApps.length} registros de ingreso están incompletos (sin crear empleado).`, type: 'warning' as const });
    }

    const supplySection: ReportSection = {
        title: "Oferta (Ingresos)",
        metrics: [
            { label: "Ingresos (7 días)", value: weeklyApplications.length, status: 'neutral' },
            { label: "Ingresos (30 días)", value: recentApplications.length, status: 'good' },
            { label: "Pendientes Finalizar", value: pendingApps.length, status: pendingApps.length > 0 ? 'warning' : 'good' }
        ],
        insights: supplyInsights
    };


    // --- 4. VISITS ANALYSIS ---
    // visitedHotelIds calculated above
    const zeroVisitHotels = safeHotels.filter(h => !visitedHotelIds.has(h.id));
    const pendingCount = zeroVisitHotels.length;
    
    const visitsInsights = [];
    
    if (pendingCount > 0) {
        if (pendingCount <= 5) {
            const names = zeroVisitHotels.map(h => h.name).join(", ");
            visitsInsights.push({ text: `Pendientes de visita: ${names}.`, type: 'warning' as const });
        } else {
            visitsInsights.push({ text: `Atención: ${pendingCount} hoteles operativos no han sido visitados este mes.`, type: 'warning' as const });
        }
    } else {
        visitsInsights.push({ text: "Excelente: Cobertura completa del 100% en hoteles operativos.", type: 'positive' as const });
    }

    const visitsSection: ReportSection = {
        title: "Supervisión (Visitas 30d)",
        metrics: [
            { label: "Visitas Realizadas", value: safeVisits.length, status: 'neutral' },
            { label: "Hoteles Pendientes", value: pendingCount, status: pendingCount === 0 ? 'good' : 'warning' }
        ],
        insights: visitsInsights
    };


    // --- 5. WORKRECORD ANALYSIS ---
    const workrecordInsights = [];
    if (avgCompliance < 70) {
        workrecordInsights.push({ text: `La adopción general es baja (${avgCompliance.toFixed(0)}%). Requiere refuerzo.`, type: 'negative' as const });
    } else if (avgCompliance > 90) {
        workrecordInsights.push({ text: "Excelente disciplina digital en los hoteles Workrecord.", type: 'positive' as const });
    }

    // Problem Hotel
    const hotelScores: Record<string, {total: number, count: number}> = {};
    safeStats.forEach(s => {
        if (!hotelScores[s.employee.hotelId]) hotelScores[s.employee.hotelId] = {total: 0, count: 0};
        hotelScores[s.employee.hotelId].total += s.compliancePercentage;
        hotelScores[s.employee.hotelId].count++;
    });
    
    const lowScoreHotel = Object.entries(hotelScores)
        .map(([id, data]) => ({ id, avg: data.total/data.count }))
        .sort((a,b) => a.avg - b.avg)[0];

    if (lowScoreHotel && lowScoreHotel.avg < 60) {
        const hName = safeHotels.find(h => h.id === lowScoreHotel.id)?.name || 'Hotel';
        workrecordInsights.push({ text: `${hName} es el punto crítico con ${lowScoreHotel.avg.toFixed(0)}% de cumplimiento.`, type: 'warning' as const });
    }

    const workrecordSection: ReportSection = {
        title: "Disciplina Workrecord",
        metrics: [
            { label: "Cumplimiento Prom.", value: `${avgCompliance.toFixed(0)}%`, status: avgCompliance > 80 ? 'good' : avgCompliance > 60 ? 'warning' : 'critical' },
            { label: "Usuarios Activos", value: safeStats.length, status: 'neutral' }
        ],
        insights: workrecordInsights
    };
    
    // Calculate Hotel Health Scores
    const healthScores: HotelHealth[] = safeHotels.map(h => {
        let score = 0;
        const issues = [];
        
        // Critical Requests (+3)
        const hCritical = openRequests.filter(r => r.hotel_id === h.id && differenceInHours(new Date(), new Date(r.created_at)) > 24).length; 
        if (hCritical > 0) {
            score += (hCritical * 3);
            issues.push(`${hCritical} Solicitudes Críticas`);
        }

        // Open Requests (+1)
        const hOpen = openRequests.filter(r => r.hotel_id === h.id).length;
        if (hOpen > 0) {
            score += hOpen;
            if (hCritical === 0) issues.push(`${hOpen} Vacantes Activas`);
        }

        // Missed Visits (+2)
        const hVisited = visitedHotelIds.has(h.id);
        if (!hVisited) {
            score += 2;
            issues.push("Sin visita reciente (30d)");
        }
        
        // Low Workrecord Compliance (+3)
        const hStats = safeStats.filter(s => s.employee.hotelId === h.id);
        if (hStats.length > 0) {
             const hCompliance = hStats.reduce((acc, curr) => acc + curr.compliancePercentage, 0) / hStats.length;
             if (hCompliance < 60) {
                 score += 3;
                 issues.push(`Baja Disciplina WR (${hCompliance.toFixed(0)}%)`);
             }
        }

        return {
            id: h.id,
            name: h.name,
            score,
            issues,
            status: score >= 5 ? 'critical' : score >= 2 ? 'warning' : 'healthy'
        };
    }).sort((a,b) => b.score - a.score);


    // --- AJUSTE DE CÁLCULO HONESTO ---
    // Si hay hoteles críticos, la puntuación global no puede ser 'saludable'.
    const tieneHotelesCriticos = healthScores.some(h => h.status === 'critical');

    if (tieneHotelesCriticos && totalScore >= 80) {
        totalScore = 79; // Limitar la puntuación a la categoría de 'riesgo'
        healthStatus = 'risk';
        healthMessage = "Operación estable, pero existen hoteles con incidencias críticas que requieren atención inmediata.";
    }

    setReport({
        accountHealth: { score: totalScore, status: healthStatus, message: healthMessage },
        talent: talentSection,
        demand: demandSection,
        supply: supplySection,
        visits: visitsSection,
        workrecord: workrecordSection,
        hotelHealth: healthScores,
        loading: false
    });

  }, [
      employees, loadingEmp, 
      hotels, loadingHotels, 
      activeRequests, allRequests, loadingReq, 
      applications, loadingApps, 
      adoptionStats, loadingAdoption, 
      visits, loadingVisits
  ]);

  return report || { loading: true };
}
