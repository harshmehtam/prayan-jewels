'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import type { CheckoutStep } from '@/app/checkout/page';

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
}

const steps = [
  { id: 'shipping', name: 'Shipping Address', description: 'Where should we deliver?' },
  { id: 'billing', name: 'Billing Address', description: 'Payment information' },
  { id: 'review', name: 'Review Order', description: 'Confirm your purchase' },
];

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <nav aria-label="Progress" className="mb-6 sm:mb-8">
      <ol className="flex items-center justify-center">
        {steps.map((step, stepIdx) => {
          const isCompleted = stepIdx < currentStepIndex;
          const isCurrent = step.id === currentStep;
          
          return (
            <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-4 sm:pr-8 lg:pr-20' : ''} flex-1 max-w-xs`}>
              {/* Connector line */}
              {stepIdx !== steps.length - 1 && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={`h-0.5 w-full ${isCompleted ? 'bg-black' : 'bg-gray-200'}`} />
                </div>
              )}
              
              {/* Step indicator */}
              <div className="relative flex flex-col items-center">
                {isCompleted ? (
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-black flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 sm:h-5 sm:w-5 text-white" aria-hidden="true" />
                  </div>
                ) : isCurrent ? (
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-black bg-white flex items-center justify-center">
                    <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-black" />
                  </div>
                ) : (
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                    <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-transparent" />
                  </div>
                )}
                
                {/* Step label */}
                <div className="mt-2 sm:mt-3 text-center max-w-full">
                  <div className={`text-xs sm:text-sm font-medium ${
                    isCurrent ? 'text-black' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                  } truncate`}>
                    {step.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}