import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PageTitle, Card, Button, Input } from '../../components/ui';
import { GdsDcfPartner } from '@sixt/shared';

const ParamsContainer = styled.div`
  padding: 20px;
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${props => props.theme.colors.text};
`;

const PartnersGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const PartnerCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: white;
  
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

const FeeItem = styled.div`
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  
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

  const updateRegionFee = (region: 'EMEA' | 'Americas' | 'Other', field: 'amount' | 'currency', value: any) => {
    if (!editingPartner) return;

    const updatedFees = editingPartner.feesByRegion.map(fee =>
      fee.region === region ? { ...fee, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : fee
    );

    setEditingPartner({ ...editingPartner, feesByRegion: updatedFees });
  };

  if (loading) {
    return (
      <div>
        <PageTitle>Calc. Parameter</PageTitle>
        <Card>
          <InfoMessage>Loading parameters...</InfoMessage>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageTitle>Calc. Parameter - GDS & DCF Partners</PageTitle>
      
      <Card>
        <ParamsContainer>
          <Section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <SectionTitle style={{ marginBottom: 0 }}>Partner Configuration</SectionTitle>
              <Button onClick={() => alert('Add new partner feature coming soon')}>
                + Add Partner
              </Button>
            </div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
              Manage GDS and DCF partner fee configurations. Changes will affect future calculations.
            </p>

            {partners.length === 0 ? (
              <InfoMessage>
                No partner configurations found. Default partners will be used for calculations.
              </InfoMessage>
            ) : (
              <PartnersGrid>
                {partners.map(partner => (
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
                    
                    <SourceChannels>
                      <strong>Source Channels:</strong> {partner.sourceChannels.join(', ')}
                    </SourceChannels>
                    
                    <RegionFees>
                      {partner.feesByRegion.map(fee => (
                        <FeeItem key={fee.region}>
                          <label>{fee.region}</label>
                          <div className="value">
                            {fee.currency} {fee.amount.toFixed(2)}
                          </div>
                        </FeeItem>
                      ))}
                    </RegionFees>

                    {partner.voucherRules && (
                      <div style={{ marginTop: 12, fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                        Special Rule: DFR {partner.voucherRules.dfrCodes.join(', ')} → 
                        {partner.voucherRules.feeAdjustment > 0 ? '+' : ''}
                        {partner.voucherRules.feeAdjustment.toFixed(2)} {partner.feesByRegion[0]?.currency}
                      </div>
                    )}
                  </PartnerCard>
                ))}
              </PartnersGrid>
            )}
          </Section>
        </ParamsContainer>
      </Card>

      {showModal && editingPartner && (
        <Modal onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Edit Partner: {editingPartner.name}</ModalTitle>
              <Button onClick={() => setShowModal(false)}>✕</Button>
            </ModalHeader>

            <FormGroup>
              <label>Partner Name</label>
              <Input
                value={editingPartner.name}
                onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
              />
            </FormGroup>

            <FormGroup>
              <label>Source Channels (comma-separated)</label>
              <Input
                value={editingPartner.sourceChannels.join(', ')}
                onChange={(e) => setEditingPartner({ 
                  ...editingPartner, 
                  sourceChannels: e.target.value.split(',').map(s => s.trim()) 
                })}
              />
            </FormGroup>

            <SectionTitle>Fee by Region</SectionTitle>
            
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
