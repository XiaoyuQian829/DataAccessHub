'use client';

import { useState } from 'react';
// import { useAuth } from '../../components/AuthProvider';
import Layout from '../../components/Layout';
import { approvalService } from '../../services/approvals';

export default function TestDataPage() {
  // const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const generateTestData = async () => {
    setLoading(true);
    setMessage('Generating test data...');

    try {
      // Clear existing data
      localStorage.removeItem('approval_requests');
      localStorage.removeItem('approval_next_id');

      // Pool of 10 different biological research scenarios
      const allTestRequests = [
        {
          title: "COVID-19 Variant Genome Sequence Analysis",
          description: "Analysis of SARS-CoV-2 variant genome sequence data to study viral evolution and transmission mechanisms",
          sensitivity: "normal" as const,
          dataset: "viral_genome_sequences",
          justification: "Required for virology research to track viral mutation trends, important for public health",
          access_purpose: "Viral genome evolution analysis and variant characterization research",
          data_fields: ["sequence_id", "genome_sequence", "collection_date", "geographic_location", "variant_type"]
        },
        {
          title: "Cancer Patient Genomics Data Mining",
          description: "Analysis of cancer patient whole genome sequencing data to identify oncogenes and therapeutic targets",
          sensitivity: "high" as const,
          dataset: "cancer_genomics_data",
          justification: "Required for precision cancer medicine research and personalized treatment development",
          access_purpose: "Cancer genomics research and therapeutic target discovery",
          data_fields: ["patient_id", "genome_data", "mutation_profile", "clinical_outcome", "treatment_response"]
        },
        {
          title: "Human Embryo Development Single-Cell Transcriptome Study",
          description: "Study of single-cell gene expression patterns during human embryonic development",
          sensitivity: "critical" as const,
          dataset: "human_embryo_scRNA_seq",
          justification: "Required for fundamental developmental biology research, involves human embryo data with important scientific value and ethical considerations",
          access_purpose: "Human embryonic development mechanism research and cell differentiation trajectory analysis",
          data_fields: ["cell_id", "gene_expression", "developmental_stage", "cell_type", "embryo_metadata"]
        },
        {
          title: "Brain Organoid Neural Network Analysis",
          description: "Multi-omics analysis of human brain organoids to study neural development and neurological disorders",
          sensitivity: "high" as const,
          dataset: "brain_organoid_data",
          justification: "Essential for understanding neurological diseases and developing therapeutic interventions",
          access_purpose: "Neural development research and disease modeling",
          data_fields: ["organoid_id", "cell_types", "neural_markers", "connectivity_data", "maturation_stage"]
        },
        {
          title: "Plant Genome CRISPR Editing Analysis",
          description: "Genome-wide analysis of CRISPR-edited crop plants for improved yield and disease resistance",
          sensitivity: "normal" as const,
          dataset: "plant_genome_editing",
          justification: "Critical for sustainable agriculture and food security research",
          access_purpose: "Agricultural biotechnology and crop improvement",
          data_fields: ["plant_id", "edit_sites", "phenotype_data", "yield_metrics", "resistance_genes"]
        },
        {
          title: "Marine Microbiome Biodiversity Study",
          description: "Metagenomic analysis of marine microbiomes to study ocean ecosystem health and climate change impacts",
          sensitivity: "normal" as const,
          dataset: "marine_microbiome",
          justification: "Vital for understanding climate change effects on marine ecosystems",
          access_purpose: "Environmental microbiology and climate research",
          data_fields: ["sample_location", "species_abundance", "functional_genes", "environmental_data", "temporal_changes"]
        },
        {
          title: "Stem Cell Differentiation Pathway Analysis",
          description: "Single-cell RNA sequencing of induced pluripotent stem cells during directed differentiation",
          sensitivity: "high" as const,
          dataset: "stem_cell_differentiation",
          justification: "Essential for regenerative medicine and understanding cell fate decisions",
          access_purpose: "Stem cell biology and regenerative therapy development",
          data_fields: ["cell_stage", "transcription_factors", "signaling_pathways", "differentiation_markers", "time_course"]
        },
        {
          title: "Ancient DNA Evolutionary Analysis",
          description: "Genomic analysis of ancient DNA samples to trace human migration and evolutionary patterns",
          sensitivity: "critical" as const,
          dataset: "ancient_dna_samples",
          justification: "Important for understanding human evolution and population genetics",
          access_purpose: "Evolutionary biology and anthropological research",
          data_fields: ["sample_age", "geographic_origin", "dna_fragments", "population_markers", "migration_patterns"]
        },
        {
          title: "Bacterial Antibiotic Resistance Genomics",
          description: "Whole genome sequencing of antibiotic-resistant bacterial strains to identify resistance mechanisms",
          sensitivity: "high" as const,
          dataset: "antibiotic_resistance_genomics",
          justification: "Urgent need to combat antimicrobial resistance for public health",
          access_purpose: "Antimicrobial resistance research and drug development",
          data_fields: ["strain_id", "resistance_genes", "plasmid_data", "mutation_profiles", "drug_susceptibility"]
        },
        {
          title: "Coral Reef Symbiosis Transcriptomics",
          description: "RNA-seq analysis of coral-algae symbiosis under thermal stress conditions",
          sensitivity: "normal" as const,
          dataset: "coral_symbiosis_data",
          justification: "Critical for understanding coral bleaching and reef conservation strategies",
          access_purpose: "Marine biology and conservation research",
          data_fields: ["coral_species", "symbiont_type", "stress_markers", "temperature_data", "bleaching_response"]
        }
      ];

      // Randomly select 3 requests from the pool of 10
      const shuffled = [...allTestRequests].sort(() => Math.random() - 0.5);
      const testRequests = shuffled.slice(0, 3);

      // Add random time ranges
      testRequests.forEach(request => {
        const startMonth = Math.floor(Math.random() * 12) + 1;
        const endMonth = Math.floor(Math.random() * 12) + 1;
        request.time_range_start = `2024-${startMonth.toString().padStart(2, '0')}-01`;
        request.time_range_end = `2024-${Math.max(startMonth, endMonth).toString().padStart(2, '0')}-28`;
      });

      const applicants = [
        "dr_smith", "prof_johnson", "postdoc_chen", "phd_martinez", "research_fellow_kim", 
        "lab_manager_brown", "grad_student_davis", "postdoc_wilson", "researcher_garcia", "scientist_taylor"
      ];
      
      // Randomly select 3 applicants
      const selectedApplicants = [...applicants].sort(() => Math.random() - 0.5).slice(0, 3);

      // Create requests
      for (let i = 0; i < testRequests.length; i++) {
        const request = await approvalService.createRequest(
          testRequests[i], 
          selectedApplicants[i]
        );

        // Automatically submit first request to PI review
        if (i === 0) {
          await approvalService.submitRequest(request.id);
          setMessage(prev => prev + `\n✅ Request "${request.title}" submitted for PI review`);
        }

        // Second request advances to ethics review
        if (i === 1) {
          await approvalService.submitRequest(request.id);
          await approvalService.piReview(request.id, true, "PI approved for research purposes", "pi_reviewer");
          setMessage(prev => prev + `\n⚖️ Request "${request.title}" entered ethics review stage`);
        }

        // Third request advances to admin review
        if (i === 2) {
          await approvalService.submitRequest(request.id);
          await approvalService.piReview(request.id, true, "PI approved", "pi_reviewer");
          await approvalService.ethicsReview(request.id, true, "Ethics review passed", "ethics_reviewer");
          setMessage(prev => prev + `\n👩‍💼 Request "${request.title}" entered admin review stage`);
        }

        setMessage(prev => prev + `\n📋 Created request: ${request.title} (ID: ${request.id})`);
      }

      // Create a rejected request for testing appeals (random scenario)
      const rejectedScenarios = [
        {
          title: "Unapproved Human Clinical Trial Data Access",
          description: "Request access to human clinical trial data not yet approved by ethics committee",
          dataset: "human_clinical_trial_data",
          justification: "For exploratory research, hoping to obtain early data access",
          access_purpose: "Human clinical trial data pre-analysis",
          data_fields: ["subject_id", "clinical_data", "biomarkers"]
        },
        {
          title: "Sensitive Patient Genomic Data Request",
          description: "Access to patient genomic data without proper institutional review board approval",
          dataset: "patient_genomic_data", 
          justification: "Preliminary analysis for potential research project",
          access_purpose: "Exploratory genomic analysis",
          data_fields: ["patient_dna", "medical_history", "genetic_variants"]
        },
        {
          title: "Restricted Biobank Sample Access",
          description: "Request for access to restricted biobank samples for unauthorized analysis",
          dataset: "biobank_samples",
          justification: "Need samples for proof-of-concept study",
          access_purpose: "Unauthorized biomarker discovery",
          data_fields: ["sample_id", "tissue_type", "donor_info"]
        }
      ];
      
      const randomRejected = rejectedScenarios[Math.floor(Math.random() * rejectedScenarios.length)];
      const randomApplicant = applicants[Math.floor(Math.random() * applicants.length)];
      
      const rejectedRequest = await approvalService.createRequest({
        ...randomRejected,
        sensitivity: "critical" as const,
        time_range_start: "2024-01-01",
        time_range_end: "2024-12-31"
      }, randomApplicant);

      await approvalService.submitRequest(rejectedRequest.id);
      await approvalService.piReview(rejectedRequest.id, false, "Rejected for testing purposes", "test_pi");
      setMessage(prev => prev + `\n❌ Created rejected request for testing appeal functionality`);

      setMessage(prev => prev + `\n\n🎉 Test data generation completed! Now you can:`);
      setMessage(prev => prev + `\n1. Visit "Approval Workflow" to view pending approval requests`);
      setMessage(prev => prev + `\n2. Use different roles to test approval functionality`);
      setMessage(prev => prev + `\n3. Check "My Requests" for request status`);

    } catch (error) {
      console.error('Failed to generate test data:', error);
      setMessage(`❌ Failed to generate test data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    localStorage.removeItem('approval_requests');
    localStorage.removeItem('approval_next_id');
    setMessage('🗑️ All test data has been cleared');
  };

  const checkData = () => {
    const requests = JSON.parse(localStorage.getItem('approval_requests') || '[]');
    setMessage(`📊 Current data status:\nTotal requests: ${requests.length}\n`);
    
    if (requests.length > 0) {
      const statusCounts: Record<string, number> = {};
      requests.forEach((req: any) => {
        statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
      });
      
      setMessage(prev => prev + `Status distribution: ${JSON.stringify(statusCounts, null, 2)}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Test Data Generation Tool
            </h1>
            <p className="text-gray-600">
              Generate test data to validate all functions of the approval workflow system
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Control Panel</h3>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={generateTestData}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Generating...' : 'Generate Test Data'}
                </button>
                
                <button
                  onClick={checkData}
                  className="btn-secondary"
                >
                  Check Data Status
                </button>
                
                <button
                  onClick={clearData}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  Clear All Data
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Usage Instructions</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Click "Generate Test Data" to create approval requests with different statuses</li>
                  <li>• After generation, visit "Approval Workflow" to view pending approval items</li>
                  <li>• Use different roles to test approval functionality</li>
                  <li>• admin can approve all types, manager handles ethics review</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {message && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Execution Results</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                {message}
              </pre>
            </div>
          </div>
        )}

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Test Steps</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Click the "Generate Test Data" button</li>
            <li>Visit the "Approval Workflow" page to view pending approval requests</li>
            <li>Use admin account to test approval operations</li>
            <li>Switch to manager account to test ethics review</li>
            <li>Check "My Requests" to verify status changes</li>
            <li>Check "Audit Logs" to view operation records</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}