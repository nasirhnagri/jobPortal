import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { AlertCircle, Clock } from 'lucide-react';

export const EmployerPending = () => {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto mt-16">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
              Account Pending Approval
            </h1>
            <p className="mt-4 text-slate-600 max-w-md mx-auto">
              Thank you for registering as an employer on JobNexus. Your account is currently under review by our admin team.
            </p>
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">What happens next?</p>
                  <ul className="mt-2 text-sm text-amber-700 space-y-1">
                    <li>• Our team will review your registration</li>
                    <li>• You'll receive access to post jobs once approved</li>
                    <li>• This usually takes 1-2 business days</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              In the meantime, you can complete your company profile to speed up the review process.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
