import React from 'react';
import { PageTitle, Card } from '../../components/ui';

export default function FsmCalculationPage() {
  return (
    <div>
      <PageTitle>Calculation Rules</PageTitle>
      <Card>
        <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>
          FSM calculation engine coming soon.
        </p>
        <div style={{ marginTop: 20, padding: '0 40px 40px' }}>
          <h3 style={{ marginBottom: 10 }}>Prepaid No Show Fee</h3>
          <p>
            <strong>Formula:</strong> Prepaid amount in EUR × 20%
          </p>
        </div>
      </Card>
    </div>
  );
}
