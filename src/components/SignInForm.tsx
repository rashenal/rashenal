import React, { useState } from 'react';
import EnhancedAuthForm from './EnhancedAuthForm';

export default function SignInForm() {
  const [mode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="w-full">
      <EnhancedAuthForm 
        mode={mode}
        className="w-full"
      />
    </div>
  );
}