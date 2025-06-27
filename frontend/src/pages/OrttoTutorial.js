import React from 'react';
import { HelpCircle, Clock, Users, Copy } from 'lucide-react';

const TutorialStep = ({ icon, title, children }) => (
  <div className="bg-primary border border-border rounded-xl p-6 flex items-start space-x-4">
    <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      <div className="text-text-secondary space-y-2">{children}</div>
    </div>
  </div>
);

const OrttoTutorial = () => {
  return (
    <div className="space-y-8">
      <header className="pb-4 border-b border-border">
        <h1 className="text-3xl font-bold text-text flex items-center">
          <HelpCircle size={32} className="mr-3 text-accent" />
          Ortto Tutorials
        </h1>
        <p className="text-text-secondary mt-1">
          Quick guides to help you get the most out of your Ortto account.
        </p>
      </header>

      <div className="space-y-6">
        <TutorialStep icon={<Copy size={24} />} title="How to Duplicate Campaigns">
          <p>
            Duplicating a campaign allows you to quickly reuse a previous campaign's design and settings.
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>Navigate to the 'Campaigns' section in your Ortto dashboard.</li>
            <li>Find the campaign you want to duplicate.</li>
            <li>Click the three-dot menu on the right side of the campaign row.</li>
            <li>Select 'Duplicate' from the dropdown menu.</li>
            <li>Give your new campaign a name and you're ready to edit it.</li>
          </ol>
        </TutorialStep>

        <TutorialStep icon={<Clock size={24} />} title="How to Schedule Campaigns (US/Chicago Timezone)">
          <p>
            Schedule your campaigns to send at the optimal time for your audience.
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>In the campaign editor, proceed to the 'Schedule' step.</li>
            <li>Select 'Send at a specific time'.</li>
            <li>
              Choose the date and time. Make sure to select the correct timezone. For Chicago, you should use
              <strong> (GMT-05:00) Central Time (US & Canada)</strong>.
            </li>
            <li>
              Set the time to be between <strong>7:00 AM and 12:00 PM</strong> for maximum engagement.
            </li>
            <li>Confirm and schedule the campaign.</li>
          </ol>
        </TutorialStep>

        <TutorialStep icon={<Users size={24} />} title="How to Filter Your Audience by App Installation">
          <p>
            You can target users based on whether they have a specific app installed using custom fields.
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>Go to the 'Audience' section when creating or editing a campaign.</li>
            <li>Click on 'Add a new condition' or 'Edit audience'.</li>
            <li>From the filter dropdown, select 'Custom Fields'.</li>
            <li>
              In the condition setup, you will create a rule. The rule should be:
            </li>
            <li className="pl-4">
              <code className="bg-background/80 text-accent font-mono p-1 rounded-md">
                CUSTOM: is "Your App Name" currently installed
              </code>
            </li>
            <li>
              <strong>Important:</strong> You must use the word <strong className="text-danger">CUSTOM</strong> in all capital letters.
            </li>
            <li>This will filter your audience to only include people who have the specified app installed.</li>
          </ol>
        </TutorialStep>
      </div>
    </div>
  );
};

export default OrttoTutorial; 