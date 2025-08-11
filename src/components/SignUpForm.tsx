import React, { useState } from 'react';
import EnhancedAuthForm from './EnhancedAuthForm';

export default function SignUpForm() {
  const [mode] = useState<'signin' | 'signup'>('signup');

  return (
    <div className="w-full">
      <EnhancedAuthForm 
        mode={mode}
        className="w-full"
      />
    </div>
  );
}