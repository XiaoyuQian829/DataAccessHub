// Test data generation script
// Execute in browser console to generate test data

// Clear existing data
function clearTestData() {
  localStorage.removeItem('approval_requests');
  localStorage.removeItem('approval_next_id');
  console.log('✅ Test data cleared');
}

// Generate test request data
function generateTestRequests() {
  const testRequests = [
    {
      title: "COVID-19 Genome Variant Analysis",
      description: "Analysis of SARS-CoV-2 viral genome sequences for variant identification",
      sensitivity: "normal",
      dataset: "covid_genome_data",
      justification: "Need genomic data for viral evolution and public health research",
      access_purpose: "Research on COVID-19 variant emergence and transmission patterns",
      data_fields: ["sequence_id", "collection_date", "variant_type", "mutation_profile"],
      applicant: "xqian"
    },
    {
      title: "Cancer Patient Genomics Study",
      description: "Whole genome sequencing analysis for cancer research",
      sensitivity: "high", 
      dataset: "cancer_genomics",
      justification: "Required for identifying cancer biomarkers and therapeutic targets",
      access_purpose: "Cancer genomics research and precision medicine development",
      data_fields: ["patient_id", "tumor_type", "genomic_variants", "clinical_data"],
      applicant: "researcher"
    },
    {
      title: "Single-Cell RNA Sequencing Analysis",
      description: "scRNA-seq data analysis for developmental biology research",
      sensitivity: "critical",
      dataset: "scrna_seq_data", 
      justification: "Critical for understanding cell differentiation and development",
      access_purpose: "Single-cell transcriptomics analysis for developmental studies",
      data_fields: ["cell_id", "gene_expression", "cell_type", "developmental_stage"],
      applicant: "analyst_user"
    },
    {
      title: "Protein Structure Database Query", 
      description: "Access to protein crystallography and NMR structure data",
      sensitivity: "normal",
      dataset: "protein_structures",
      justification: "Structural biology research for drug design and function analysis",
      access_purpose: "Protein structure-function relationship studies",
      data_fields: ["protein_id", "pdb_id", "structure_data", "binding_sites"],
      applicant: "xqian"
    },
    {
      title: "Human Microbiome Metagenomics",
      description: "Metagenomic analysis of human gut microbiome samples",
      sensitivity: "critical",
      dataset: "microbiome_data",
      justification: "Investigation of microbiome-host interactions in health and disease",
      access_purpose: "Microbiome research for therapeutic development",
      data_fields: ["sample_id", "taxonomic_profile", "functional_genes", "metadata"],
      applicant: "microbiome_team"
    }
  ];

  console.log('🔄 Generating test requests...');
  
  testRequests.forEach((reqData, index) => {
    setTimeout(() => {
      approvalService.createRequest(reqData, reqData.applicant)
        .then(request => {
          console.log(`✅ Created request ${index + 1}: ${request.title} (ID: ${request.id})`);
          
          // Automatically advance some requests to different states for testing
          setTimeout(() => {
            if (index === 0) {
              // First request advance to PI review
              approvalService.submitRequest(request.id);
              console.log(`📝 Submitted request ${request.id} for PI review`);
            } else if (index === 1) {
              // Second request advance to ethics review
              approvalService.submitRequest(request.id).then(() => {
                return approvalService.piReview(request.id, true, "PI approved for research purposes", "pi_reviewer");
              }).then(() => {
                console.log(`👨‍🔬 PI approved request ${request.id}, now in ethics review`);
              });
            } else if (index === 2) {
              // Third request advance to admin review
              approvalService.submitRequest(request.id).then(() => {
                return approvalService.piReview(request.id, true, "PI approved", "pi_reviewer");
              }).then(() => {
                return approvalService.ethicsReview(request.id, true, "Ethics approved", "ethics_reviewer");
              }).then(() => {
                console.log(`⚖️ Ethics approved request ${request.id}, now in admin review`);
              });
            }
          }, 1000);
        })
        .catch(error => {
          console.error(`❌ Failed to create request ${index + 1}:`, error);
        });
    }, index * 500);
  });
}

// Simulate complete approval workflow
async function simulateFullWorkflow() {
  console.log('🎭 Simulating full approval workflow...');
  
  try {
    // Create request
    const request = await approvalService.createRequest({
      title: "Full Workflow Test",
      description: "Complete workflow simulation",
      sensitivity: "high",
      dataset: "test_dataset",
      justification: "Testing complete approval workflow",
      access_purpose: "Workflow testing and validation",
      data_fields: ["user_id", "email"]
    }, "test_applicant");
    
    console.log(`📋 Created request: ${request.title} (ID: ${request.id})`);
    
    // Submit for review
    await approvalService.submitRequest(request.id);
    console.log(`📤 Submitted for PI review`);
    
    // PI review
    await approvalService.piReview(request.id, true, "PI approved for testing", "test_pi");
    console.log(`👨‍🔬 PI approved`);
    
    // Ethics review
    await approvalService.ethicsReview(request.id, true, "Ethics approved for testing", "test_ethics");
    console.log(`⚖️ Ethics approved`);
    
    // Admin review (because of high sensitivity)
    await approvalService.adminReview(request.id, true, "Admin approved for testing", "test_admin");
    console.log(`👩‍💼 Admin approved`);
    
    // AI review will be triggered automatically
    console.log(`🤖 AI review completed automatically`);
    
    const finalRequest = approvalService.requests.find(r => r.id === request.id);
    console.log(`✅ Final status: ${finalRequest?.status}`);
    console.log(`🎯 Workflow simulation completed successfully!`);
    
  } catch (error) {
    console.error('❌ Workflow simulation failed:', error);
  }
}

// Test rejection and appeal workflow
async function testRejectionAndAppeal() {
  console.log('🚫 Testing rejection and appeal workflow...');
  
  try {
    // Create request
    const request = await approvalService.createRequest({
      title: "Rejection Test Request",
      description: "Testing rejection and appeal mechanism",
      sensitivity: "normal",
      dataset: "test_dataset",
      justification: "Testing rejection workflow",
      access_purpose: "Rejection testing",
      data_fields: ["user_id"]
    }, "test_applicant");
    
    // Submit and immediately reject
    await approvalService.submitRequest(request.id);
    await approvalService.piReview(request.id, false, "Rejected for testing purposes", "test_pi");
    
    console.log(`❌ Request rejected by PI`);
    
    // Submit appeal
    await approvalService.submitAppeal(request.id, "Appeal for testing - request should be reconsidered");
    console.log(`📧 Appeal submitted`);
    
    const finalRequest = approvalService.requests.find(r => r.id === request.id);
    console.log(`📮 Final status: ${finalRequest?.status}`);
    
  } catch (error) {
    console.error('❌ Rejection test failed:', error);
  }
}

// Performance test
function performanceTest() {
  console.log('⚡ Running performance test...');
  
  const startTime = performance.now();
  
  // Create large number of requests
  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(
      approvalService.createRequest({
        title: `Performance Test ${i}`,
        description: `Performance test request ${i}`,
        sensitivity: "normal",
        dataset: "test_dataset",
        justification: "Performance testing",
        access_purpose: "Performance testing",
        data_fields: ["user_id"]
      }, `test_user_${i}`)
    );
  }
  
  Promise.all(promises).then(() => {
    const endTime = performance.now();
    console.log(`✅ Created 20 requests in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`📊 Average: ${((endTime - startTime) / 20).toFixed(2)}ms per request`);
  });
}

// Main test function
function runAllTests() {
  console.log('🧪 Starting comprehensive testing...');
  
  // Clear data
  clearTestData();
  
  // Wait a bit before starting tests
  setTimeout(() => {
    generateTestRequests();
    
    setTimeout(() => {
      simulateFullWorkflow();
    }, 3000);
    
    setTimeout(() => {
      testRejectionAndAppeal(); 
    }, 6000);
    
    setTimeout(() => {
      performanceTest();
    }, 9000);
    
  }, 1000);
}

// Validate data integrity
function validateData() {
  const requests = JSON.parse(localStorage.getItem('approval_requests') || '[]');
  
  console.log('📊 Data Validation Report:');
  console.log(`Total requests: ${requests.length}`);
  
  const statusCounts = {};
  requests.forEach(req => {
    statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
  });
  
  console.log('Status distribution:', statusCounts);
  
  const sensitivityCounts = {};
  requests.forEach(req => {
    sensitivityCounts[req.sensitivity] = (sensitivityCounts[req.sensitivity] || 0) + 1;
  });
  
  console.log('Sensitivity distribution:', sensitivityCounts);
  
  // Validate audit logs
  const totalAuditEntries = requests.reduce((total, req) => total + (req.audit_trail?.length || 0), 0);
  console.log(`Total audit entries: ${totalAuditEntries}`);
  
  return {
    totalRequests: requests.length,
    statusCounts,
    sensitivityCounts,
    totalAuditEntries
  };
}

// Export test functions to global scope
window.testDataUtils = {
  clearTestData,
  generateTestRequests,
  simulateFullWorkflow,
  testRejectionAndAppeal,
  performanceTest,
  runAllTests,
  validateData
};

console.log('🛠️ Test utilities loaded. Available commands:');
console.log('- testDataUtils.clearTestData() - Clear all test data');
console.log('- testDataUtils.generateTestRequests() - Generate sample requests');
console.log('- testDataUtils.simulateFullWorkflow() - Run complete workflow');
console.log('- testDataUtils.testRejectionAndAppeal() - Test rejection/appeal');
console.log('- testDataUtils.performanceTest() - Run performance test');
console.log('- testDataUtils.runAllTests() - Run all tests');
console.log('- testDataUtils.validateData() - Validate data integrity');