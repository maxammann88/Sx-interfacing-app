import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PageTitle, Card, Button, Input } from '../../components/ui';
import { GdsDcfPartner } from '@sixt/shared';

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

const CategoryBadge = styled.span<{ type: 'gds' | 'dcf' }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.type === 'gds' ? '#e3f2fd' : '#fff3e0'};
  color: ${props => props.type === 'gds' ? '#1976d2' : '#f57c00'};
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

export default function FsmParametersPage() {
  const [partners, setPartners] = useState<GdsDcfPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPartner, setEditingPartner] = useState<GdsDcfPartner | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [gdsOpen, setGdsOpen] = useState(false);
  const [dcfOpen, setDcfOpen] = useState(false);

  useEffect(() => {
    loadPartners();
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

  const handleEdit = (partner: GdsDcfPartner) => {
    setEditingPartner({ ...partner });
    setShowModal(true);
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
              {partner.feesByRegion.map(fee => (
                <FeeItem key={fee.region}>
                  <label>POS: {fee.region}</label>
                  <div className="value">
                    {fee.currency} {(partner.id === 'amadeus' ? 5.29 : fee.amount).toFixed(2)}
                  </div>
                </FeeItem>
              ))}
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
                <div style={{ marginBottom: 16 }}>
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
                <div style={{ marginBottom: 16 }}>
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

            <SectionTitle>Fee by Region (Standard)</SectionTitle>
            
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
                        value={fee?.amount || 0}
                        onChange={(e) => updateRegionFee(region as any, 'amount', e.target.value)}
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
                            disabled
                            style={{ flex: '0 0 100px', background: '#f5f5f5' }}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={feeData.amount}
                            onChange={(e) => updateAmadeusDfr('without', dfrCode, 'amount', e.target.value)}
                            style={{ flex: 1 }}
                            placeholder="Amount"
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
                            disabled
                            style={{ flex: '0 0 100px', background: '#f5f5f5' }}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={feeData.amount}
                            onChange={(e) => updateAmadeusDfr('with', dfrCode, 'amount', e.target.value)}
                            style={{ flex: 1 }}
                            placeholder="Amount"
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
                          disabled
                          style={{ flex: '0 0 100px', background: '#f5f5f5' }}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={feeData.amount}
                          onChange={(e) => updateDfrFee(dfrCode, 'amount', e.target.value)}
                          style={{ flex: 1 }}
                          placeholder="Amount"
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
    </div>
  );
}
