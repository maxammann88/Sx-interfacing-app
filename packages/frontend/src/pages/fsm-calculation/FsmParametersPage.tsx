import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PageTitle, Card, Button, Input } from '../../components/ui';
import { GdsDcfPartner, FranchiseMandant } from '@sixt/shared';
import ValidationRulesEditor from './ValidationRulesEditor';

const ParamsContainer = styled.div`
  padding: 20px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const CollapsibleSection = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
`;

const SectionHeader = styled.div<{ isOpen: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: ${props => props.isOpen ? '#f8f9fa' : 'white'};
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CategoryBadge = styled.span<{ type: 'gds' | 'dcf' | 'franchise' }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.type === 'gds' ? '#e3f2fd' : props.type === 'dcf' ? '#fff3e0' : '#e8f5e9'};
  color: ${props => props.type === 'gds' ? '#1976d2' : props.type === 'dcf' ? '#f57c00' : '#2e7d32'};
`;

const ExpandIcon = styled.span<{ isOpen: boolean }>`
  font-size: 20px;
  transition: transform 0.2s;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const SectionContent = styled.div<{ isOpen: boolean }>`
  max-height: ${props => props.isOpen ? '2000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
`;

const PartnersGrid = styled.div`
  display: grid;
  gap: 16px;
  padding: 20px;
`;

const PartnerCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
`;

const PartnerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const PartnerName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const RegionFees = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 12px;
`;

const RegionLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 12px;
`;

const FeeItem = styled.div`
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  
  label {
    font-size: 12px;
    font-weight: 600;
    color: ${props => props.theme.colors.textSecondary};
    display: block;
    margin-bottom: 4px;
  }
  
  .value {
    font-size: 15px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
  }
`;

const DfrSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
`;

const DfrTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${props => props.theme.colors.text};
`;

const DfrList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const DfrTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f0f0f0;
  border-radius: 16px;
  font-size: 12px;
  color: #333;
  
  button {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 0;
    font-size: 14px;
    line-height: 1;
    
    &:hover {
      color: #dc3545;
    }
  }
`;

const FeeVariant = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e0e0e0;
`;

const VariantLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DfrSubItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  font-size: 13px;
  margin-top: 8px;
  
  .dfr-code {
    font-weight: 600;
    color: ${props => props.theme.colors.text};
  }
  
  .dfr-fee {
    font-weight: 600;
    color: ${props => props.theme.colors.primary};
  }
`;

const SourceChannels = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  
  strong {
    color: ${props => props.theme.colors.text};
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 6px;
    color: ${props => props.theme.colors.text};
  }
`;

const InfoMessage = styled.div`
  text-align: center;
  color: #999;
  padding: 40px;
  font-size: 14px;
`;

const MandantsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-top: 16px;

  th {
    background: #f5f5f5;
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid #e0e0e0;
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  tbody tr:hover {
    background: #fafafa;
  }
`;

const UploadButton = styled(Button)`
  position: relative;
  cursor: pointer;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const MessageBox = styled.div<{ type: 'success' | 'error' }>`
  padding: 12px 16px;
  border-radius: 6px;
  margin: 16px 0;
  background: ${props => props.type === 'success' ? '#d4edda' : '#f8d7da'};
  border-left: 4px solid ${props => props.type === 'success' ? '#28a745' : '#dc3545'};
  color: ${props => props.type === 'success' ? '#155724' : '#721c24'};
  font-size: 13px;
`;

export default function FsmParametersPage() {
  const [partners, setPartners] = useState<GdsDcfPartner[]>([]);
  const [mandants, setMandants] = useState<FranchiseMandant[]>([]);
  const [loading, setLoading] = useState(true);
  const [mandantsLoading, setMandantsLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editingPartner, setEditingPartner] = useState<GdsDcfPartner | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyPartner, setHistoryPartner] = useState<GdsDcfPartner | null>(null);
  const [gdsOpen, setGdsOpen] = useState(false);
  const [dcfOpen, setDcfOpen] = useState(false);
  const [mandantsOpen, setMandantsOpen] = useState(false);
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [validationRulesOpen, setValidationRulesOpen] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<{ regionName: string; countries: string; validFrom?: string; validTo?: string; notes?: string } | null>(null);
  const [showRegionHistoryModal, setShowRegionHistoryModal] = useState(false);
  const [regionHistoryData, setRegionHistoryData] = useState<any[]>([]);
  const [historyRegionName, setHistoryRegionName] = useState<string>('');

  useEffect(() => {
    loadPartners();
    loadMandants();
    loadRegions();
  }, []);

  const loadPartners = async () => {
    try {
      const response = await fetch('/api/gds-dcf/partners');
      const result = await response.json();
      if (result.success) {
        setPartners(result.data);
      }
    } catch (err) {
      console.error('Failed to load partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMandants = async () => {
    try {
      const response = await fetch('/api/gds-dcf/mandants');
      const result = await response.json();
      if (result.success) {
        setMandants(result.data);
      }
    } catch (err) {
      console.error('Failed to load mandants:', err);
    }
  };

  const loadRegions = async () => {
    try {
      // Add cache-busting parameter to force fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/gds-dcf/regions?_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const result = await response.json();
      if (result.success) {
        console.log('Loaded regions:', result.data);
        setRegions(result.data);
      }
    } catch (err) {
      console.error('Failed to load regions:', err);
    }
  };

  const handleMandantUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMandantsLoading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/gds-dcf/mandants/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setMandants(result.data.mandants);
        setUploadMessage({ type: 'success', text: `Successfully loaded ${result.data.count} franchise countries` });
        setMandantsOpen(true);
      } else {
        setUploadMessage({ type: 'error', text: result.error || 'Upload failed' });
      }
    } catch (err) {
      console.error('Failed to upload mandants:', err);
      setUploadMessage({ type: 'error', text: 'Failed to upload file' });
    } finally {
      setMandantsLoading(false);
      event.target.value = '';
    }
  };

  const handleClearMandants = async () => {
    if (!confirm('Are you sure you want to clear all franchise mandants? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/gds-dcf/mandants', {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        setMandants([]);
        setUploadMessage({ type: 'success', text: `Cleared ${result.data.count} franchise countries` });
      }
    } catch (err) {
      console.error('Failed to clear mandants:', err);
      setUploadMessage({ type: 'error', text: 'Failed to clear mandants' });
    }
  };

  const handleEdit = (partner: GdsDcfPartner) => {
    setEditingPartner({ ...partner });
    setShowModal(true);
  };

  const handleHistory = async (partner: GdsDcfPartner) => {
    try {
      const response = await fetch(`/api/gds-dcf/partners/${partner.id}/history`);
      const result = await response.json();
      
      if (result.success) {
        setHistoryData(result.data);
        setHistoryPartner(partner);
        setShowHistoryModal(true);
      } else {
        alert('Failed to load history');
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      alert('Failed to load partner history');
    }
  };

  const handleDeleteFuturePartnerVersion = async (partnerId: string, revision: number) => {
    if (!confirm(`Are you sure you want to delete this future revision?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/gds-dcf/partners/${partnerId}/history/${revision}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`Future revision deleted successfully`);
        // Reload history
        if (historyPartner) {
          await handleHistory(historyPartner);
        }
      } else {
        alert(result.error || 'Failed to delete future revision');
      }
    } catch (err) {
      console.error('Failed to delete future revision:', err);
      alert('Failed to delete future revision');
    }
  };

  const handleAddRegion = () => {
    setEditingRegion({ 
      regionName: '', 
      countries: '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      notes: '',
    });
    setShowRegionModal(true);
  };

  const handleEditRegion = async (region: any) => {
    // When editing a region, we're creating a NEW version
    // So we should default to today's date, not the old validFrom
    setEditingRegion({
      regionName: region.regionName,
      countries: region.countries?.join(', ') || '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      notes: '',
    });
    setShowRegionModal(true);
  };

  const handleRegionHistory = async (regionName: string) => {
    try {
      const response = await fetch(`/api/gds-dcf/regions/${regionName}/history`);
      const result = await response.json();
      
      if (result.success) {
        setRegionHistoryData(result.data);
        setHistoryRegionName(regionName);
        setShowRegionHistoryModal(true);
      } else {
        alert('Failed to load region history');
      }
    } catch (err) {
      console.error('Failed to load region history:', err);
      alert('Failed to load region history');
    }
  };

  const handleDeleteFutureRegionVersion = async (regionName: string, validFrom: string) => {
    if (!confirm(`Are you sure you want to delete this future version of ${regionName}?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/gds-dcf/regions/${regionName}/future/${validFrom}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`Future version deleted successfully`);
        // Reload history
        await handleRegionHistory(regionName);
        // Reload regions list
        await loadRegions();
      } else {
        alert(result.error || 'Failed to delete future version');
      }
    } catch (err) {
      console.error('Failed to delete future version:', err);
      alert('Failed to delete future version');
    }
  };

  const handleSaveRegion = async () => {
    if (!editingRegion || !editingRegion.regionName || !editingRegion.countries) {
      alert('Please provide region name and country codes');
      return;
    }

    try {
      const countryCodes = editingRegion.countries
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter(c => c.length > 0);

      // Client-side validation: Check for 2-character format
      const invalidFormat = countryCodes.filter(code => code.length !== 2);
      if (invalidFormat.length > 0) {
        alert(`Invalid country codes (must be exactly 2 characters):\n${invalidFormat.map(c => c.toUpperCase()).join(', ')}`);
        return;
      }

      // Client-side validation: Check for duplicates within the list
      const codeCount = new Map<string, number>();
      for (const code of countryCodes) {
        codeCount.set(code, (codeCount.get(code) || 0) + 1);
      }
      
      const duplicates = Array.from(codeCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([code, count]) => `${code.toUpperCase()} (${count} times)`);
      
      if (duplicates.length > 0) {
        alert(`Duplicate countries found in your list:\n${duplicates.join(', ')}\n\nPlease remove duplicates and try again.`);
        return;
      }

      // Use timestamp with milliseconds to avoid conflicts
      // But respect the date selected by the user for validFrom
      let validFromDate: Date;
      
      if (editingRegion.validFrom) {
        // Parse the date string (format: YYYY-MM-DD) and create a date in local timezone
        const [year, month, day] = editingRegion.validFrom.split('-').map(Number);
        validFromDate = new Date(year, month - 1, day);
        
        // Set to start of day (00:00:00) so it's immediately active
        validFromDate.setHours(0, 0, 0, 0);
      } else {
        validFromDate = new Date();
        validFromDate.setHours(0, 0, 0, 0);
      }
      
      // Add a small timestamp offset to make it unique (milliseconds only)
      validFromDate.setMilliseconds(new Date().getMilliseconds());

      console.log('Saving region with validFrom:', editingRegion.validFrom, '→', validFromDate.toISOString());

      const response = await fetch('/api/gds-dcf/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionName: editingRegion.regionName,
          countryCodes,
          validFrom: validFromDate.toISOString(),
          validTo: editingRegion.validTo ? new Date(editingRegion.validTo).toISOString() : null,
          notes: editingRegion.notes || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await loadRegions();
        setShowRegionModal(false);
        setEditingRegion(null);
      } else {
        alert(result.error || 'Failed to save region mapping');
      }
    } catch (err) {
      console.error('Failed to save region:', err);
      alert('Failed to save region mapping');
    }
  };

  const handleDeleteRegion = async (regionName: string) => {
    if (!confirm(`Are you sure you want to close the mapping for region "${regionName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/gds-dcf/regions/${regionName}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadRegions();
      }
    } catch (err) {
      console.error('Failed to delete region:', err);
      alert('Failed to delete region mapping');
    }
  };

  const handleSave = async () => {
    if (!editingPartner) return;

    try {
      const response = await fetch('/api/gds-dcf/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPartner),
      });

      const result = await response.json();
      if (result.success) {
        await loadPartners();
        setShowModal(false);
        setEditingPartner(null);
      }
    } catch (err) {
      console.error('Failed to save partner:', err);
      alert('Failed to save partner configuration');
    }
  };

  const handleDelete = async (partnerId: string) => {
    if (!confirm('Are you sure you want to delete this partner configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/gds-dcf/partners/${partnerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPartners();
      }
    } catch (err) {
      console.error('Failed to delete partner:', err);
      alert('Failed to delete partner configuration');
    }
  };

  const handleAddPartner = (type: 'gds' | 'dcf') => {
    const partnerName = prompt('Enter partner name:');
    if (!partnerName) return;

    const partnerId = partnerName.toLowerCase().replace(/\s+/g, '-');

    const newPartner: GdsDcfPartner = {
      id: partnerId,
      name: partnerName,
      category: type,
      sourceChannels: [''],
      feesByRegion: [
        { region: 'EMEA', amount: 0, currency: 'EUR' },
        { region: 'Americas', amount: 0, currency: 'EUR' },
        { region: 'Other', amount: 0, currency: 'EUR' },
      ],
      voucherRules: { dfrFees: {} },
    };

    setEditingPartner(newPartner);
    setShowModal(true);
  };

  const updateRegionFee = (region: 'EMEA' | 'Americas' | 'Other', field: 'amount' | 'currency', value: any) => {
    if (!editingPartner) return;

    const updatedFees = editingPartner.feesByRegion.map(fee =>
      fee.region === region ? { ...fee, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : fee
    );

    setEditingPartner({ ...editingPartner, feesByRegion: updatedFees });
  };

  const updateRegionFeeWithoutEVoucher = (region: 'EMEA' | 'Americas' | 'Other', field: 'amount' | 'currency', value: any) => {
    if (!editingPartner) return;

    const currentFees = editingPartner.feesByRegionWithoutEVoucher || [
      { region: 'EMEA', amount: 5.29, currency: 'EUR' },
      { region: 'Americas', amount: 5.29, currency: 'EUR' },
      { region: 'Other', amount: 5.29, currency: 'EUR' },
    ];

    const updatedFees = currentFees.map(fee =>
      fee.region === region ? { ...fee, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : fee
    );

    setEditingPartner({ ...editingPartner, feesByRegionWithoutEVoucher: updatedFees });
  };

  const addDfrCode = () => {
    if (!editingPartner) return;
    
    const dfrCode = prompt('Enter DFR Code:');
    if (!dfrCode) return;
    
    const feeAmount = prompt(`Enter fee amount for DFR ${dfrCode} (e.g., 5.29 or 2.75):`);
    if (feeAmount === null) return;
    
    const amount = parseFloat(feeAmount) || 0;
    
    const currency = prompt('Enter currency (EUR or USD):', 'EUR');
    if (!currency) return;
    
    const updatedRules = editingPartner.voucherRules || { dfrFees: {} };
    
    setEditingPartner({
      ...editingPartner,
      voucherRules: {
        dfrFees: {
          ...updatedRules.dfrFees,
          [dfrCode]: { amount, currency },
        },
      },
    });
  };

  const addAmadeusDfr = (variant: 'without' | 'with') => {
    if (!editingPartner) return;
    
    const dfrCode = prompt('Enter DFR Code:');
    if (!dfrCode) return;
    
    const feeAmount = prompt(`Enter fee amount for DFR ${dfrCode} (e.g., 5.29):`);
    if (feeAmount === null) return;
    
    const amount = parseFloat(feeAmount) || 0;
    
    const currency = prompt('Enter currency (EUR or USD):', 'EUR');
    if (!currency) return;
    
    if (variant === 'without') {
      setEditingPartner({
        ...editingPartner,
        dfrFeesWithoutEVoucher: {
          ...(editingPartner.dfrFeesWithoutEVoucher || {}),
          [dfrCode]: { amount, currency },
        },
      });
    } else {
      setEditingPartner({
        ...editingPartner,
        dfrFeesWithEVoucher: {
          ...(editingPartner.dfrFeesWithEVoucher || {}),
          [dfrCode]: { amount, currency },
        },
      });
    }
  };

  const removeAmadeusDfr = (variant: 'without' | 'with', codeToRemove: string) => {
    if (!editingPartner) return;
    
    if (variant === 'without') {
      const { [codeToRemove]: removed, ...remaining } = editingPartner.dfrFeesWithoutEVoucher || {};
      setEditingPartner({
        ...editingPartner,
        dfrFeesWithoutEVoucher: remaining,
      });
    } else {
      const { [codeToRemove]: removed, ...remaining } = editingPartner.dfrFeesWithEVoucher || {};
      setEditingPartner({
        ...editingPartner,
        dfrFeesWithEVoucher: remaining,
      });
    }
  };

  const updateAmadeusDfr = (variant: 'without' | 'with', dfrCode: string, field: 'amount' | 'currency', value: any) => {
    if (!editingPartner) return;
    
    if (variant === 'without') {
      const currentFee = editingPartner.dfrFeesWithoutEVoucher?.[dfrCode];
      if (!currentFee) return;
      
      setEditingPartner({
        ...editingPartner,
        dfrFeesWithoutEVoucher: {
          ...editingPartner.dfrFeesWithoutEVoucher,
          [dfrCode]: {
            ...currentFee,
            [field]: field === 'amount' ? (parseFloat(value) || 0) : value,
          },
        },
      });
    } else {
      const currentFee = editingPartner.dfrFeesWithEVoucher?.[dfrCode];
      if (!currentFee) return;
      
      setEditingPartner({
        ...editingPartner,
        dfrFeesWithEVoucher: {
          ...editingPartner.dfrFeesWithEVoucher,
          [dfrCode]: {
            ...currentFee,
            [field]: field === 'amount' ? (parseFloat(value) || 0) : value,
          },
        },
      });
    }
  };

  const updateAmadeusDfrCode = (variant: 'without' | 'with', oldCode: string, newCode: string) => {
    if (!editingPartner || !newCode || newCode === oldCode) return;
    
    if (variant === 'without') {
      const currentFee = editingPartner.dfrFeesWithoutEVoucher?.[oldCode];
      if (!currentFee) return;
      
      const { [oldCode]: removed, ...remaining } = editingPartner.dfrFeesWithoutEVoucher || {};
      
      setEditingPartner({
        ...editingPartner,
        dfrFeesWithoutEVoucher: {
          ...remaining,
          [newCode]: currentFee,
        },
      });
    } else {
      const currentFee = editingPartner.dfrFeesWithEVoucher?.[oldCode];
      if (!currentFee) return;
      
      const { [oldCode]: removed, ...remaining } = editingPartner.dfrFeesWithEVoucher || {};
      
      setEditingPartner({
        ...editingPartner,
        dfrFeesWithEVoucher: {
          ...remaining,
          [newCode]: currentFee,
        },
      });
    }
  };

  const removeDfrCode = (codeToRemove: string) => {
    if (!editingPartner || !editingPartner.voucherRules) return;
    
    const { [codeToRemove]: removed, ...remainingFees } = editingPartner.voucherRules.dfrFees;
    
    setEditingPartner({
      ...editingPartner,
      voucherRules: {
        dfrFees: remainingFees,
      },
    });
  };

  const updateDfrFee = (dfrCode: string, field: 'amount' | 'currency', value: any) => {
    if (!editingPartner || !editingPartner.voucherRules) return;
    
    const currentFee = editingPartner.voucherRules.dfrFees[dfrCode];
    
    setEditingPartner({
      ...editingPartner,
      voucherRules: {
        dfrFees: {
          ...editingPartner.voucherRules.dfrFees,
          [dfrCode]: {
            ...currentFee,
            [field]: field === 'amount' ? (parseFloat(value) || 0) : value,
          },
        },
      },
    });
  };

  const updateDfrCode = (oldCode: string, newCode: string) => {
    if (!editingPartner || !editingPartner.voucherRules || !newCode || newCode === oldCode) return;
    
    const currentFee = editingPartner.voucherRules.dfrFees[oldCode];
    if (!currentFee) return;
    
    const { [oldCode]: removed, ...remainingFees } = editingPartner.voucherRules.dfrFees;
    
    setEditingPartner({
      ...editingPartner,
      voucherRules: {
        dfrFees: {
          ...remainingFees,
          [newCode]: currentFee,
        },
      },
    });
  };

  const gdsPartners = partners.filter(p => p.category === 'gds');

  const dcfPartners = partners.filter(p => p.category === 'dcf');

  const renderPartners = (partnerList: GdsDcfPartner[]) => (
    <PartnersGrid>
      {partnerList.map(partner => (
        <PartnerCard key={partner.id}>
          <PartnerHeader>
            <PartnerName>{partner.name}</PartnerName>
            <ButtonGroup>
              <Button onClick={() => handleEdit(partner)}>Edit</Button>
              <Button onClick={() => handleHistory(partner)} style={{ background: '#6c757d' }}>
                📜 History
              </Button>
              <Button onClick={() => handleDelete(partner.id)} style={{ background: '#dc3545' }}>
                Delete
              </Button>
            </ButtonGroup>
          </PartnerHeader>
          
          {/* Standard Fee or Without eVoucher */}
          <div>
            <VariantLabel>
              {partner.id === 'amadeus' ? 'Without eVoucher' : 'Standard Fee'}
            </VariantLabel>
            <RegionFees>
              {partner.id === 'amadeus' ? (
                partner.feesByRegionWithoutEVoucher ? (
                  partner.feesByRegionWithoutEVoucher.map(fee => (
                    <FeeItem key={fee.region}>
                      <label>POS: {fee.region}</label>
                      <div className="value">
                        {fee.currency} {fee.amount.toFixed(2)}
                      </div>
                    </FeeItem>
                  ))
                ) : (
                  partner.feesByRegion.map(fee => (
                    <FeeItem key={fee.region}>
                      <label>POS: {fee.region}</label>
                      <div className="value">
                        {fee.currency} {(5.29).toFixed(2)}
                      </div>
                    </FeeItem>
                  ))
                )
              ) : (
                partner.feesByRegion.map(fee => (
                  <FeeItem key={fee.region}>
                    <label>POS: {fee.region}</label>
                    <div className="value">
                      {fee.currency} {fee.amount.toFixed(2)}
                    </div>
                  </FeeItem>
                ))
              )}
            </RegionFees>
            
            {/* DFR Exceptions for without eVoucher (Amadeus) or standard (others) */}
            {partner.id === 'amadeus' && partner.dfrFeesWithoutEVoucher && Object.keys(partner.dfrFeesWithoutEVoucher).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <DfrTitle style={{ fontSize: 11 }}>DFR Exceptions:</DfrTitle>
                {Object.entries(partner.dfrFeesWithoutEVoucher).map(([dfrCode, feeData]) => (
                  <DfrSubItem key={dfrCode} style={{ marginTop: 6, padding: 6 }}>
                    <span className="dfr-code" style={{ fontSize: 11 }}>{dfrCode}</span>
                    <span className="dfr-fee" style={{ fontSize: 11 }}>
                      {feeData.currency} {feeData.amount.toFixed(2)}
                    </span>
                  </DfrSubItem>
                ))}
              </div>
            )}
          </div>

          {/* eVoucher Fee for Amadeus */}
          {partner.id === 'amadeus' && (
            <FeeVariant>
              <VariantLabel>
                With eVoucher
              </VariantLabel>
              <RegionFees>
                {partner.feesByRegion.map(fee => (
                  <FeeItem key={fee.region}>
                    <label>POS: {fee.region}</label>
                    <div className="value">
                      {fee.currency} {fee.amount.toFixed(2)}
                    </div>
                  </FeeItem>
                ))}
              </RegionFees>
              
              {/* DFR Exceptions for with eVoucher */}
              {partner.dfrFeesWithEVoucher && Object.keys(partner.dfrFeesWithEVoucher).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <DfrTitle style={{ fontSize: 11 }}>DFR Exceptions:</DfrTitle>
                  {Object.entries(partner.dfrFeesWithEVoucher).map(([dfrCode, feeData]) => (
                    <DfrSubItem key={dfrCode} style={{ marginTop: 6, padding: 6 }}>
                      <span className="dfr-code" style={{ fontSize: 11 }}>{dfrCode}</span>
                      <span className="dfr-fee" style={{ fontSize: 11 }}>
                        {feeData.currency} {feeData.amount.toFixed(2)}
                      </span>
                    </DfrSubItem>
                  ))}
                </div>
              )}
            </FeeVariant>
          )}

          {/* DFR Exceptions for non-Amadeus partners */}
          {partner.id !== 'amadeus' && partner.voucherRules && Object.keys(partner.voucherRules.dfrFees).length > 0 && (
            <DfrSection>
              <DfrTitle>DFR Exceptions:</DfrTitle>
              {Object.entries(partner.voucherRules.dfrFees).map(([dfrCode, feeData]) => (
                <DfrSubItem key={dfrCode}>
                  <span className="dfr-code">{dfrCode}</span>
                  <span className="dfr-fee">
                    {feeData.currency} {feeData.amount.toFixed(2)}
                  </span>
                </DfrSubItem>
              ))}
            </DfrSection>
          )}
        </PartnerCard>
      ))}
    </PartnersGrid>
  );

  if (loading) {
    return (
      <div>
        <PageTitle>Parameter Maintenance</PageTitle>
        <Card>
          <InfoMessage>Loading parameters...</InfoMessage>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageTitle>Parameter Maintenance</PageTitle>
      
      <Card>
        <ParamsContainer>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
            Manage parameter set-up here. Changes will affect future calculations.
          </p>

          <Section>
            <CollapsibleSection>
              <SectionHeader isOpen={gdsOpen} onClick={() => setGdsOpen(!gdsOpen)}>
                <SectionTitle>
                  <CategoryBadge type="gds">GDS</CategoryBadge>
                  Global Distribution System
                  <span style={{ fontSize: 14, fontWeight: 'normal', color: '#666', marginLeft: 8 }}>
                    ({gdsPartners.length})
                  </span>
                </SectionTitle>
                <ExpandIcon isOpen={gdsOpen}>▼</ExpandIcon>
              </SectionHeader>
              <SectionContent isOpen={gdsOpen}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', paddingRight: 12 }}>
                  <Button onClick={() => handleAddPartner('gds')} style={{ fontSize: 13 }}>
                    + Add GDS Partner
                  </Button>
                </div>
                {gdsPartners.length === 0 ? (
                  <InfoMessage>No GDS partners configured.</InfoMessage>
                ) : (
                  renderPartners(gdsPartners)
                )}
              </SectionContent>
            </CollapsibleSection>
          </Section>

          <Section>
            <CollapsibleSection>
              <SectionHeader isOpen={dcfOpen} onClick={() => setDcfOpen(!dcfOpen)}>
                <SectionTitle>
                  <CategoryBadge type="dcf">DCF</CategoryBadge>
                  Direct Connect Fee
                  <span style={{ fontSize: 14, fontWeight: 'normal', color: '#666', marginLeft: 8 }}>
                    ({dcfPartners.length})
                  </span>
                </SectionTitle>
                <ExpandIcon isOpen={dcfOpen}>▼</ExpandIcon>
              </SectionHeader>
              <SectionContent isOpen={dcfOpen}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', paddingRight: 12 }}>
                  <Button onClick={() => handleAddPartner('dcf')} style={{ fontSize: 13 }}>
                    + Add DCF Partner
                  </Button>
                </div>
                {dcfPartners.length === 0 ? (
                  <InfoMessage>No DCF partners configured.</InfoMessage>
                ) : (
                  renderPartners(dcfPartners)
                )}
              </SectionContent>
            </CollapsibleSection>
          </Section>

          <Section>
            <CollapsibleSection>
              <SectionHeader isOpen={mandantsOpen} onClick={() => setMandantsOpen(!mandantsOpen)}>
                <SectionTitle>
                  <CategoryBadge type="franchise">FRANCHISE</CategoryBadge>
                  Franchise Mandants
                  <span style={{ fontSize: 14, fontWeight: 'normal', color: '#666', marginLeft: 8 }}>
                    ({mandants.length})
                  </span>
                </SectionTitle>
                <ExpandIcon isOpen={mandantsOpen}>▼</ExpandIcon>
              </SectionHeader>
              <SectionContent isOpen={mandantsOpen}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 12 }}>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    Upload Excel file with franchise country FIR codes (Column A)
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {mandants.length > 0 && (
                      <Button 
                        onClick={handleClearMandants} 
                        style={{ fontSize: 13, background: '#dc3545' }}
                      >
                        Clear All
                      </Button>
                    )}
                    <UploadButton as="label" style={{ fontSize: 13 }}>
                      {mandantsLoading ? 'Uploading...' : '📤 Upload Excel'}
                      <HiddenFileInput 
                        type="file" 
                        accept=".xlsx,.xls" 
                        onChange={handleMandantUpload}
                        disabled={mandantsLoading}
                      />
                    </UploadButton>
                  </div>
                </div>

                {uploadMessage && (
                  <MessageBox type={uploadMessage.type}>
                    {uploadMessage.text}
                  </MessageBox>
                )}

                {mandants.length === 0 ? (
                  <InfoMessage>No franchise mandants loaded. Please upload an Excel file.</InfoMessage>
                ) : (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                      {mandants.length} Franchise Countries Loaded
                    </div>
                    <MandantsTable>
                      <thead>
                        <tr>
                          <th>FIR</th>
                          <th>ISO Code</th>
                          <th>Country Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mandants.map((mandant, idx) => (
                          <tr key={idx}>
                            <td><strong>{mandant.fir}</strong></td>
                            <td>{mandant.iso || '-'}</td>
                            <td>{mandant.countryName || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </MandantsTable>
                  </>
                )}
              </SectionContent>
            </CollapsibleSection>
          </Section>

          <Section>
            <CollapsibleSection>
              <SectionHeader isOpen={regionsOpen} onClick={() => setRegionsOpen(!regionsOpen)}>
                <SectionTitle>
                  <CategoryBadge type="franchise" style={{ background: '#e3f2fd', color: '#1976d2' }}>REGIONS</CategoryBadge>
                  Region-Country Mapping
                  <span style={{ fontSize: 14, fontWeight: 'normal', color: '#666', marginLeft: 8 }}>
                    ({regions.length} regions)
                  </span>
                </SectionTitle>
                <ExpandIcon isOpen={regionsOpen}>▼</ExpandIcon>
              </SectionHeader>
              <SectionContent isOpen={regionsOpen}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 12 }}>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    Define which countries belong to which region (EMEA is default for unmapped countries)
                  </div>
                  <Button onClick={handleAddRegion} style={{ fontSize: 13 }}>
                    + Add Region
                  </Button>
                </div>

                {regions.length === 0 ? (
                  <InfoMessage>No custom regions defined yet. Click "+ Add Region" to create one.</InfoMessage>
                ) : (
                  <PartnersGrid>
                    {regions.map((region: any) => (
                      <PartnerCard key={region.regionName}>
                        <PartnerHeader>
                          <PartnerName>{region.regionName}</PartnerName>
                          <ButtonGroup>
                            <Button onClick={() => handleEditRegion(region)}>Edit</Button>
                            <Button onClick={() => handleRegionHistory(region.regionName)} style={{ background: '#6c757d' }}>
                              📜 History
                            </Button>
                            <Button onClick={() => handleDeleteRegion(region.regionName)} style={{ background: '#dc3545' }}>
                              Close
                            </Button>
                          </ButtonGroup>
                        </PartnerHeader>
                        
                        <div style={{ marginTop: 12, fontSize: 13 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            {region.countryCount} {region.countryCount === 1 ? 'country' : 'countries'}
                          </div>
                          {region.countries && region.countries.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {[...region.countries].sort().map((code: string) => (
                                <span 
                                  key={code}
                                  style={{
                                    background: '#e3f2fd',
                                    color: '#1976d2',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </PartnerCard>
                    ))}
                  </PartnersGrid>
                )}
              </SectionContent>
            </CollapsibleSection>
          </Section>

          <Section>
            <CollapsibleSection>
              <SectionHeader isOpen={validationRulesOpen} onClick={() => setValidationRulesOpen(!validationRulesOpen)}>
                <SectionTitle>
                  <CategoryBadge type="franchise" style={{ background: '#f3e5f5', color: '#7b1fa2' }}>RULES</CategoryBadge>
                  Validation Rules Configuration
                  <span style={{ fontSize: 14, fontWeight: 'normal', color: '#666', marginLeft: 8 }}>
                    (temporally versioned)
                  </span>
                </SectionTitle>
                <ExpandIcon isOpen={validationRulesOpen}>▼</ExpandIcon>
              </SectionHeader>
              <SectionContent isOpen={validationRulesOpen}>
                <ValidationRulesEditor />
              </SectionContent>
            </CollapsibleSection>
          </Section>
        </ParamsContainer>
      </Card>

      {showModal && editingPartner && (
        <Modal onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {partners.some(p => p.id === editingPartner.id) ? 'Edit' : 'Create'} Partner: {editingPartner.name}
              </ModalTitle>
              <Button onClick={() => setShowModal(false)}>✕</Button>
            </ModalHeader>

            <FormGroup>
              <label>Partner Name</label>
              <Input
                value={editingPartner.name}
                onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
              />
            </FormGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <FormGroup>
                <label>Valid From *</label>
                <Input
                  type="date"
                  value={editingPartner.validFrom || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEditingPartner({ ...editingPartner, validFrom: e.target.value } as any)}
                  required
                />
              </FormGroup>

              <FormGroup>
                <label>Valid To (leave empty for indefinite)</label>
                <Input
                  type="date"
                  value={editingPartner.validTo || ''}
                  onChange={(e) => setEditingPartner({ ...editingPartner, validTo: e.target.value || null } as any)}
                />
              </FormGroup>
            </div>

            <FormGroup style={{ marginTop: 16 }}>
              <label>Notes (optional - describe what changed in this revision)</label>
              <textarea
                value={(editingPartner as any).notes || ''}
                onChange={(e) => setEditingPartner({ ...editingPartner, notes: e.target.value } as any)}
                placeholder="e.g., 'Increased EMEA fee due to market changes' or 'Added new DFR exception for customer 12345'"
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </FormGroup>

            {/* Amadeus: Without eVoucher fees */}
            {editingPartner.id === 'amadeus' && (
              <>
                <div style={{ marginTop: 20, marginBottom: 8 }}>
                  <SectionTitle>Fee by Region - Without eVoucher</SectionTitle>
                </div>
                
                {['EMEA', 'Americas', 'Other'].map(region => {
                  const fee = editingPartner.feesByRegionWithoutEVoucher?.find(f => f.region === region);
                  return (
                    <div key={region} style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{region}</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <FormGroup style={{ marginBottom: 0 }}>
                          <label>Amount</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={fee?.amount ?? 5.29}
                            onChange={(e) => updateRegionFeeWithoutEVoucher(region as any, 'amount', e.target.value)}
                            placeholder="0.00"
                          />
                        </FormGroup>
                        <FormGroup style={{ marginBottom: 0 }}>
                          <label>Currency</label>
                          <select
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            value={fee?.currency || 'EUR'}
                            onChange={(e) => updateRegionFeeWithoutEVoucher(region as any, 'currency', e.target.value)}
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                          </select>
                        </FormGroup>
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: 20, marginBottom: 8 }}>
                  <SectionTitle>Fee by Region - With eVoucher</SectionTitle>
                </div>
              </>
            )}

            {/* Standard Fee by Region title for non-Amadeus or With eVoucher for Amadeus */}
            {editingPartner.id !== 'amadeus' && (
              <SectionTitle>Fee by Region (Standard)</SectionTitle>
            )}
            
            {['EMEA', 'Americas', 'Other'].map(region => {
              const fee = editingPartner.feesByRegion.find(f => f.region === region);
              return (
                <div key={region} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{region}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <FormGroup style={{ marginBottom: 0 }}>
                      <label>Amount</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={fee?.amount ?? ''}
                        onChange={(e) => updateRegionFee(region as any, 'amount', e.target.value)}
                        placeholder="0.00"
                      />
                    </FormGroup>
                    <FormGroup style={{ marginBottom: 0 }}>
                      <label>Currency</label>
                      <select
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        value={fee?.currency || 'EUR'}
                        onChange={(e) => updateRegionFee(region as any, 'currency', e.target.value)}
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </FormGroup>
                  </div>
                </div>
              );
            })}

            {/* Amadeus-specific: Two separate DFR sections */}
            {editingPartner.id === 'amadeus' && (
              <>
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label style={{ fontWeight: 600, fontSize: 14 }}>DFR Exceptions - Without eVoucher</label>
                    <Button onClick={() => addAmadeusDfr('without')} style={{ fontSize: 12, padding: '6px 12px' }}>
                      + Add DFR
                    </Button>
                  </div>
                  
                  {editingPartner.dfrFeesWithoutEVoucher && Object.keys(editingPartner.dfrFeesWithoutEVoucher).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(editingPartner.dfrFeesWithoutEVoucher).map(([dfrCode, feeData]) => (
                        <div key={dfrCode} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Input
                            value={dfrCode}
                            onChange={(e) => updateAmadeusDfrCode('without', dfrCode, e.target.value)}
                            onBlur={(e) => {
                              const newCode = e.target.value.trim();
                              if (newCode && newCode !== dfrCode) {
                                updateAmadeusDfrCode('without', dfrCode, newCode);
                              }
                            }}
                            style={{ flex: '0 0 100px' }}
                            placeholder="DFR Code"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={feeData.amount ?? ''}
                            onChange={(e) => updateAmadeusDfr('without', dfrCode, 'amount', e.target.value)}
                            style={{ flex: 1 }}
                            placeholder="0.00"
                          />
                          <select
                            value={feeData.currency}
                            onChange={(e) => updateAmadeusDfr('without', dfrCode, 'currency', e.target.value)}
                            style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                          </select>
                          <button
                            onClick={() => removeAmadeusDfr('without', dfrCode)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label style={{ fontWeight: 600, fontSize: 14 }}>DFR Exceptions - With eVoucher</label>
                    <Button onClick={() => addAmadeusDfr('with')} style={{ fontSize: 12, padding: '6px 12px' }}>
                      + Add DFR
                    </Button>
                  </div>
                  
                  {editingPartner.dfrFeesWithEVoucher && Object.keys(editingPartner.dfrFeesWithEVoucher).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(editingPartner.dfrFeesWithEVoucher).map(([dfrCode, feeData]) => (
                        <div key={dfrCode} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Input
                            value={dfrCode}
                            onChange={(e) => updateAmadeusDfrCode('with', dfrCode, e.target.value)}
                            onBlur={(e) => {
                              const newCode = e.target.value.trim();
                              if (newCode && newCode !== dfrCode) {
                                updateAmadeusDfrCode('with', dfrCode, newCode);
                              }
                            }}
                            style={{ flex: '0 0 100px' }}
                            placeholder="DFR Code"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={feeData.amount ?? ''}
                            onChange={(e) => updateAmadeusDfr('with', dfrCode, 'amount', e.target.value)}
                            style={{ flex: 1 }}
                            placeholder="0.00"
                          />
                          <select
                            value={feeData.currency}
                            onChange={(e) => updateAmadeusDfr('with', dfrCode, 'currency', e.target.value)}
                            style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                          </select>
                          <button
                            onClick={() => removeAmadeusDfr('with', dfrCode)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Non-Amadeus partners: Single DFR section */}
            {editingPartner.id !== 'amadeus' && (
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>DFR Exceptions</label>
                  <Button onClick={addDfrCode} style={{ fontSize: 12, padding: '6px 12px' }}>
                    + Add DFR
                  </Button>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                  Define specific fees for different DFR codes. Each code can have its own fee amount.
                </div>
                
                {editingPartner.voucherRules && Object.keys(editingPartner.voucherRules.dfrFees).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(editingPartner.voucherRules.dfrFees).map(([dfrCode, feeData]) => (
                      <div key={dfrCode} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Input
                          value={dfrCode}
                          onChange={(e) => updateDfrCode(dfrCode, e.target.value)}
                          onBlur={(e) => {
                            const newCode = e.target.value.trim();
                            if (newCode && newCode !== dfrCode) {
                              updateDfrCode(dfrCode, newCode);
                            }
                          }}
                          style={{ flex: '0 0 100px' }}
                          placeholder="DFR Code"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={feeData.amount ?? ''}
                          onChange={(e) => updateDfrFee(dfrCode, 'amount', e.target.value)}
                          style={{ flex: 1 }}
                          placeholder="0.00"
                        />
                        <select
                          value={feeData.currency}
                          onChange={(e) => updateDfrFee(dfrCode, 'currency', e.target.value)}
                          style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                        </select>
                        <button
                          onClick={() => removeDfrCode(dfrCode)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Button onClick={handleSave} style={{ flex: 1 }}>Save Changes</Button>
              <Button onClick={() => setShowModal(false)} style={{ flex: 1, background: '#6c757d' }}>
                Cancel
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {showHistoryModal && historyPartner && (
        <Modal onClick={() => setShowHistoryModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
            <ModalHeader>
              <ModalTitle>
                History: {historyPartner.name}
              </ModalTitle>
              <Button onClick={() => setShowHistoryModal(false)}>✕</Button>
            </ModalHeader>

            {historyData.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No history records found
              </div>
            ) : (
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                  {historyData.length} revision{historyData.length !== 1 ? 's' : ''} found
                </div>
                
                {historyData.map((revision: any, index: number) => {
                  const isFuture = new Date(revision.validFrom) > new Date();
                  
                  return (
                  <div 
                    key={revision.id} 
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      background: index === 0 ? '#f8f9fa' : 'white',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{
                          background: index === 0 ? '#28a745' : '#6c757d',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          v{revision.revision}
                        </span>
                        {index === 0 && !isFuture && (
                          <span style={{
                            background: '#28a745',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                          }}>
                            Current
                          </span>
                        )}
                        {isFuture && (
                          <span style={{
                            background: '#ffc107',
                            color: '#000',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}>
                            Future
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isFuture && (
                          <button
                            onClick={() => handleDeleteFuturePartnerVersion(historyPartner?.id || '', revision.revision)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            🗑️ Delete
                          </button>
                        )}
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {new Date(revision.createdAt).toLocaleString('de-DE')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '12px' }}>
                      <div>
                        <strong>Valid From:</strong> {new Date(revision.validFrom).toLocaleDateString('de-DE')}
                      </div>
                      <div>
                        <strong>Valid To:</strong> {revision.validTo ? new Date(revision.validTo).toLocaleDateString('de-DE') : 'Indefinite'}
                      </div>
                      <div>
                        <strong>Category:</strong> {revision.category.toUpperCase()}
                      </div>
                      <div>
                        <strong>Created By:</strong> {revision.createdBy}
                      </div>
                    </div>

                    {/* Fees by Region */}
                    {revision.feesByRegion && revision.feesByRegion.length > 0 && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e8e8e8' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#333' }}>
                          {revision.partnerId === 'amadeus' ? 'Fees by Region (With eVoucher):' : 'Fees by Region:'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {revision.feesByRegion.map((fee: any) => (
                            <div key={fee.region} style={{ fontSize: '12px', padding: '6px 8px', background: '#f8f9fa', borderRadius: '4px' }}>
                              <div style={{ fontWeight: 600, color: '#666', marginBottom: '2px' }}>{fee.region}</div>
                              <div style={{ fontSize: '13px', color: '#000' }}>{fee.currency} {fee.amount.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fees Without eVoucher (Amadeus) */}
                    {revision.feesByRegionWithoutEVoucher && revision.feesByRegionWithoutEVoucher.length > 0 && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e8e8e8' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#333' }}>
                          Fees by Region (Without eVoucher):
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {revision.feesByRegionWithoutEVoucher.map((fee: any) => (
                            <div key={fee.region} style={{ fontSize: '12px', padding: '6px 8px', background: '#f8f9fa', borderRadius: '4px' }}>
                              <div style={{ fontWeight: 600, color: '#666', marginBottom: '2px' }}>{fee.region}</div>
                              <div style={{ fontSize: '13px', color: '#000' }}>{fee.currency} {fee.amount.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DFR Exceptions */}
                    {revision.voucherRules && revision.voucherRules.dfrFees && Object.keys(revision.voucherRules.dfrFees).length > 0 && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #fff3e0' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#333' }}>
                          DFR Exceptions:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {Object.entries(revision.voucherRules.dfrFees).map(([code, fee]: [string, any]) => (
                            <div key={code} style={{ fontSize: '12px', padding: '6px 12px', background: '#fff3e0', borderRadius: '4px', border: '1px solid #ffecb3' }}>
                              <span style={{ fontWeight: 600 }}>{code}:</span> {fee.currency} {fee.amount.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DFR Without eVoucher (Amadeus) */}
                    {revision.dfrFeesWithoutEVoucher && Object.keys(revision.dfrFeesWithoutEVoucher).length > 0 && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e3f2fd' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#333' }}>
                          DFR Exceptions (Without eVoucher):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {Object.entries(revision.dfrFeesWithoutEVoucher).map(([code, fee]: [string, any]) => (
                            <div key={code} style={{ fontSize: '12px', padding: '6px 12px', background: '#e3f2fd', borderRadius: '4px', border: '1px solid #bbdefb' }}>
                              <span style={{ fontWeight: 600 }}>{code}:</span> {fee.currency} {fee.amount.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DFR With eVoucher (Amadeus) */}
                    {revision.dfrFeesWithEVoucher && Object.keys(revision.dfrFeesWithEVoucher).length > 0 && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e8f5e9' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#333' }}>
                          DFR Exceptions (With eVoucher):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {Object.entries(revision.dfrFeesWithEVoucher).map(([code, fee]: [string, any]) => (
                            <div key={code} style={{ fontSize: '12px', padding: '6px 12px', background: '#e8f5e9', borderRadius: '4px', border: '1px solid #c8e6c9' }}>
                              <span style={{ fontWeight: 600 }}>{code}:</span> {fee.currency} {fee.amount.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {revision.notes && (
                      <div style={{ marginTop: '12px', fontSize: '13px', color: '#666', fontStyle: 'italic', padding: '8px', background: '#fffbf0', borderRadius: '4px' }}>
                        📝 Note: {revision.notes}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, padding: '0 20px 20px' }}>
              <Button onClick={() => setShowHistoryModal(false)} style={{ flex: 1 }}>
                Close
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {showRegionModal && editingRegion && (
        <Modal onClick={() => setShowRegionModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <ModalHeader>
              <ModalTitle>
                {regions.some(r => r.regionName === editingRegion.regionName) ? 'Edit' : 'Add'} Region Mapping
              </ModalTitle>
              <Button onClick={() => setShowRegionModal(false)}>✕</Button>
            </ModalHeader>

            <FormGroup>
              <label>Region Name *</label>
              <Input
                value={editingRegion.regionName}
                onChange={(e) => setEditingRegion({ ...editingRegion, regionName: e.target.value })}
                placeholder="e.g., Americas, DACH, Asia-Pacific"
                disabled={regions.some(r => r.regionName === editingRegion.regionName)}
              />
              {regions.some(r => r.regionName === editingRegion.regionName) && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  Region name cannot be changed. To rename, close this region and create a new one.
                </div>
              )}
            </FormGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <FormGroup>
                <label>Valid From *</label>
                <Input
                  type="date"
                  value={editingRegion.validFrom || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEditingRegion({ ...editingRegion, validFrom: e.target.value })}
                  required
                />
              </FormGroup>

              <FormGroup>
                <label>Valid To (leave empty for indefinite)</label>
                <Input
                  type="date"
                  value={editingRegion.validTo || ''}
                  onChange={(e) => setEditingRegion({ ...editingRegion, validTo: e.target.value })}
                />
              </FormGroup>
            </div>

            <FormGroup style={{ marginTop: 16 }}>
              <label>Notes (optional - describe what changed in this revision)</label>
              <textarea
                value={editingRegion.notes || ''}
                onChange={(e) => setEditingRegion({ ...editingRegion, notes: e.target.value })}
                placeholder="e.g., 'Added DACH countries to separate region' or 'Moved UK from EMEA to Other due to policy change'"
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </FormGroup>

            <FormGroup style={{ marginTop: 16 }}>
              <label>Country Codes * (comma-separated)</label>
              <textarea
                value={editingRegion.countries}
                onChange={(e) => setEditingRegion({ ...editingRegion, countries: e.target.value })}
                placeholder="e.g., us, ca, mx, br, ar, cl, pe, co"
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Enter ISO country codes in lowercase, separated by commas. Example: us, ca, mx, br
              </div>
              <div style={{ fontSize: 12, color: '#d9534f', marginTop: 8, fontWeight: 600 }}>
                ⚠️ Validation Rules:
                <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                  <li>Country codes must be exactly 2 characters (ISO 3166-1 alpha-2)</li>
                  <li>No duplicate codes within the same list</li>
                  <li>Each country can only belong to ONE region</li>
                  <li>Duplicates across regions are not allowed</li>
                </ul>
              </div>
            </FormGroup>

            <div style={{ marginTop: 16, padding: '12px', background: '#e3f2fd', borderRadius: '6px', fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>💡 Info:</div>
              <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                <li>Countries not in any region default to <strong>EMEA</strong></li>
                <li>Changes are effective immediately for new validations</li>
                <li>Existing validations use the mapping from their handover date</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Button onClick={handleSaveRegion} style={{ flex: 1 }}>Save Region</Button>
              <Button onClick={() => setShowRegionModal(false)} style={{ flex: 1, background: '#6c757d' }}>
                Cancel
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {showRegionHistoryModal && (
        <Modal onClick={() => setShowRegionHistoryModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
            <ModalHeader>
              <ModalTitle>
                Region History: {historyRegionName}
              </ModalTitle>
              <Button onClick={() => setShowRegionHistoryModal(false)}>✕</Button>
            </ModalHeader>

            {regionHistoryData.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No history records found
              </div>
            ) : (
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                  {regionHistoryData.length} time {regionHistoryData.length !== 1 ? 'periods' : 'period'} found
                </div>
                
                {regionHistoryData.map((period: any, index: number) => {
                  const isFuture = new Date(period.validFrom) > new Date();
                  
                  return (
                  <div 
                    key={index} 
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      background: index === 0 ? '#f8f9fa' : 'white',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {index === 0 && !isFuture && (
                          <span style={{
                            background: '#28a745',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}>
                            Current
                          </span>
                        )}
                        {isFuture && (
                          <span style={{
                            background: '#ffc107',
                            color: '#000',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}>
                            Future
                          </span>
                        )}
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>
                          {period.countries.length} {period.countries.length === 1 ? 'country' : 'countries'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isFuture && (
                          <button
                            onClick={() => handleDeleteFutureRegionVersion(historyRegionName, new Date(period.validFrom).toISOString())}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            🗑️ Delete
                          </button>
                        )}
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {new Date(period.createdAt).toLocaleString('de-DE')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '12px' }}>
                      <div>
                        <strong>Valid From:</strong> {new Date(period.validFrom).toLocaleDateString('de-DE')}
                      </div>
                      <div>
                        <strong>Valid To:</strong> {period.validTo ? new Date(period.validTo).toLocaleDateString('de-DE') : 'Indefinite'}
                      </div>
                      <div>
                        <strong>Created By:</strong> {period.createdBy}
                      </div>
                    </div>

                    {/* Country Codes */}
                    <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e3f2fd' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#333' }}>
                        Country Codes:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {period.countries.map((code: string) => (
                          <span 
                            key={code}
                            style={{
                              background: '#e3f2fd',
                              color: '#1976d2',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                            }}
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>

                    {period.notes && (
                      <div style={{ marginTop: '12px', fontSize: '13px', color: '#666', fontStyle: 'italic', padding: '8px', background: '#fffbf0', borderRadius: '4px' }}>
                        📝 Note: {period.notes}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, padding: '0 20px 20px' }}>
              <Button onClick={() => setShowRegionHistoryModal(false)} style={{ flex: 1 }}>
                Close
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
