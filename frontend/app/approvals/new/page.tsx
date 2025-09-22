'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import Layout from '../../../components/Layout';
import { approvalService } from '../../../services/approvals';

interface FormData {
  title: string;
  description: string;
  sensitivity: 'normal' | 'high' | 'critical';
  dataset: string;
  justification: string;
  access_purpose: string;
  time_range_start: string;
  time_range_end: string;
  data_fields: string[];
}

export default function NewRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    sensitivity: 'normal',
    dataset: '',
    justification: '',
    access_purpose: '',
    time_range_start: '',
    time_range_end: '',
    data_fields: []
  });

  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  
  const availableFields = [
    'sequence_id', 'collection_date', 'variant_type', 'mutation_profile', 
    'patient_id', 'tumor_type', 'genomic_variants', 'clinical_data',
    'cell_id', 'gene_expression', 'cell_type', 'protein_id', 'pdb_id', 'structure_data'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFieldToggle = (field: string) => {
    const updatedFields = selectedFields.includes(field)
      ? selectedFields.filter(f => f !== field)
      : [...selectedFields, field];
    
    setSelectedFields(updatedFields);
    setFormData(prev => ({
      ...prev,
      data_fields: updatedFields
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.dataset || 
          !formData.justification || !formData.access_purpose || formData.data_fields.length === 0) {
        alert('Please fill in all required fields and select at least one data field.');
        return;
      }

      // Create the request using the approval service (saves as DRAFT)
      const newRequest = await approvalService.createRequest(formData, user?.username || 'Unknown User');
      
      // Immediately submit the request to enter the workflow
      await approvalService.submitRequest(newRequest.id);
      
      // Show success message
      alert(`Request "${newRequest.title}" submitted successfully! It has been sent for PI review.`);
      
      // Redirect to workflow page
      router.push('/workflow');
    } catch (error) {
      console.error('Failed to submit request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Submit New Access Request
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Request access to datasets or specific data fields. Your request will be reviewed according to your organization's approval workflow.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="form-label">
                Request Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., COVID-19 Variant Analysis for Public Health Research"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="form-label">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Describe what data you need access to and how you plan to use it..."
              />
            </div>

            {/* Dataset */}
            <div>
              <label htmlFor="dataset" className="form-label">
                Target Dataset *
              </label>
              <select
                id="dataset"
                name="dataset"
                required
                value={formData.dataset}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select a dataset...</option>
                <option value="covid_genome_data">COVID-19 Genome Data</option>
                <option value="cancer_genomics">Cancer Genomics</option>
                <option value="scrna_seq_data">Single-Cell RNA-seq</option>
                <option value="protein_structures">Protein Structures</option>
                <option value="microbiome_data">Microbiome Data</option>
              </select>
            </div>

            {/* Sensitivity Level */}
            <div>
              <label htmlFor="sensitivity" className="form-label">
                Data Sensitivity Level
              </label>
              <select
                id="sensitivity"
                name="sensitivity"
                value={formData.sensitivity}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="normal">Normal</option>
                <option value="high">High Sensitivity</option>
                <option value="critical">Critical Sensitivity</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Higher sensitivity levels require additional approval steps and reviews.
              </p>
            </div>

            {/* Access Purpose */}
            <div>
              <label htmlFor="access_purpose" className="form-label">
                Access Purpose *
              </label>
              <textarea
                id="access_purpose"
                name="access_purpose"
                required
                rows={3}
                value={formData.access_purpose}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Describe the specific purpose and research objectives for this data access..."
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="time_range_start" className="form-label">
                  Access Start Date
                </label>
                <input
                  type="date"
                  id="time_range_start"
                  name="time_range_start"
                  value={formData.time_range_start}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="time_range_end" className="form-label">
                  Access End Date
                </label>
                <input
                  type="date"
                  id="time_range_end"
                  name="time_range_end"
                  value={formData.time_range_end}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Data Fields Selection */}
            <div>
              <label className="form-label">
                Required Data Fields *
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Select the specific data fields you need access to:
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {availableFields.map((field) => (
                  <label
                    key={field}
                    className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field)}
                      onChange={() => handleFieldToggle(field)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{field}</span>
                  </label>
                ))}
              </div>
              {selectedFields.length > 0 && (
                <div className="mt-3 p-2 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    Selected fields: {selectedFields.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Justification */}
            <div>
              <label htmlFor="justification" className="form-label">
                Research Justification *
              </label>
              <textarea
                id="justification"
                name="justification"
                required
                rows={3}
                value={formData.justification}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Explain the research need and how this data will be used for scientific purposes..."
              />
            </div>

            {/* Current User Info */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Request Details</h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Applicant:</dt>
                  <dd className="text-gray-900">{user?.username || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Email:</dt>
                  <dd className="text-gray-900">{user?.email || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Submission Date:</dt>
                  <dd className="text-gray-900">{new Date().toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Status:</dt>
                  <dd className="text-gray-900">Draft</dd>
                </div>
              </dl>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/approvals')}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                What happens next?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your request will be reviewed by the appropriate approvers</li>
                  <li>You'll receive notifications about status changes</li>
                  <li>Access will be granted automatically upon approval</li>
                  <li>You can track progress in the "My Requests" tab</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}