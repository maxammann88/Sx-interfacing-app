import React from 'react';
import styled from 'styled-components';
import { useUser } from '../context/UserContext';

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 13px;
  color: #666;
  white-space: nowrap;
`;

const Input = styled.input`
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  width: 180px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
  
  &::placeholder {
    color: #999;
  }
`;

export default function UserInput() {
  const { currentUser, setCurrentUser } = useUser();

  return (
    <Container>
      <Label htmlFor="current-user">Bearbeiter:</Label>
      <Input
        id="current-user"
        type="text"
        value={currentUser}
        onChange={(e) => setCurrentUser(e.target.value)}
        placeholder="Ihr Name"
        title="Wird bei allen Änderungen als 'Modified By' gespeichert"
      />
    </Container>
  );
}
