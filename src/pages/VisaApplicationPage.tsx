import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VisaApplicationStepper from '../components/EVisa/VisaApplicationStepper';
import visaApplicationsService from '../lib/api/visaApplications';

const VisaApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const { nationality, destination } = useParams<{ nationality: string; destination: string }>();

  const handleApplicationComplete = async (data: {
    travelers?: unknown[];
    travelDates?: { arrival?: string; departure?: string };
    accommodation?: Record<string, unknown>;
  }) => {
    if (!nationality || !destination) {
      navigate('/dashboard');
      return;
    }

    const { application, error } = await visaApplicationsService.createApplication({
      nationalityCode: nationality,
      destinationCode: destination,
      entryDate: data.travelDates?.arrival,
      exitDate: data.travelDates?.departure,
      applicationData: data as Record<string, unknown>,
      paymentStatus: 'pending',
    });

    if (error || !application) {
      console.error('Failed to save visa application:', error);
      alert('Your application could not be saved. Please try again.');
      return;
    }

    navigate(`/payment/${application.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Visa Application</h1>
          <p className="mt-2 text-gray-600">Complete your visa application in 5 easy steps</p>
        </div>

        <VisaApplicationStepper onComplete={handleApplicationComplete} />
      </div>
    </div>
  );
};

export default VisaApplicationPage;
