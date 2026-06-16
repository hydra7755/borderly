import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import VisaApplicationStepper from '../components/EVisa/VisaApplicationStepper';
import visaApplicationsService from '../lib/api/visaApplications';
import authService from '../lib/api/auth';
import {
  sendApplicationEmail,
  sendVisaApplicationToCompany,
} from '../services/emailService';

const VisaApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

    try {
      const { user } = await authService.getCurrentUser();
      await sendVisaApplicationToCompany({
        applicationId: application.id,
        nationalityCode: nationality,
        destinationCode: destination,
        userEmail: user?.email,
        userName: user?.full_name || user?.email?.split('@')[0],
        entryDate: data.travelDates?.arrival,
        exitDate: data.travelDates?.departure,
        paymentStatus: 'pending',
      });

      if (user?.email) {
        await sendApplicationEmail(user.email, user.full_name || 'there', 'visa');
      }
    } catch (emailError) {
      console.error('Failed to send application notification emails:', emailError);
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

        <VisaApplicationStepper
          destinationCode={destination}
          nationalityCode={nationality}
          searchParams={location.search}
          onComplete={handleApplicationComplete}
        />
      </div>
    </div>
  );
};

export default VisaApplicationPage;
