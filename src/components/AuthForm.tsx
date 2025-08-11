import React, { useState } from 'react';
import EnhancedAuthForm from './EnhancedAuthForm';

export default function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <EnhancedAuthForm 
        mode={mode} 
        onModeChange={setMode}
        className="w-full max-w-md"
      />
    </div>
  );
}