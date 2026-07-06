import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useIntl } from 'react-intl';
import { authApi } from '../../../api/auth';
import { parseFastApiError } from '../../../api/errors';

const passwordSchema = z
  .object({
    current_password: z.string().min(8, 'Enter your current password'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_password: z.string().min(8, 'Confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export default function PasswordSection() {
  const intl = useIntl();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
  });

  const onSubmit = async (values: PasswordForm) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await authApi.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      reset();
      setSuccess(intl.formatMessage({ id: 'settings.password.updated', defaultMessage: 'Your password has been updated successfully.' }));
    } catch (err: any) {
      setError(parseFastApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#111318]">
      <div>
        <p className="text-sm font-semibold text-slate-950 dark:text-white">{intl.formatMessage({ id: 'settings.password.title', defaultMessage: 'Password' })}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {intl.formatMessage({ id: 'settings.password.subtitle', defaultMessage: 'Update your password and revoke active refresh sessions.' })}
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{intl.formatMessage({ id: 'settings.password.current', defaultMessage: 'Current password' })}</label>
          <input
            type="password"
            autoComplete="current-password"
            {...register('current_password')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-[#0D111A] dark:text-white"
          />
          {errors.current_password && (
            <p className="text-xs text-red-600">{errors.current_password.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{intl.formatMessage({ id: 'settings.password.new', defaultMessage: 'New password' })}</label>
          <input
            type="password"
            autoComplete="new-password"
            {...register('new_password')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-[#0D111A] dark:text-white"
          />
          {errors.new_password && (
            <p className="text-xs text-red-600">{errors.new_password.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{intl.formatMessage({ id: 'settings.password.confirm', defaultMessage: 'Confirm new password' })}</label>
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirm_password')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-[#0D111A] dark:text-white"
          />
          {errors.confirm_password && (
            <p className="text-xs text-red-600">{errors.confirm_password.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {intl.formatMessage({ id: 'settings.password.hint', defaultMessage: 'Use strong passwords with uppercase letters, numbers and symbols.' })}
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? intl.formatMessage({ id: 'settings.password.saving', defaultMessage: 'Saving...' })
              : intl.formatMessage({ id: 'settings.password.updateAction', defaultMessage: 'Update password' })}
          </button>
        </div>

        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">{success}</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-rose-700 dark:bg-rose-900 dark:text-rose-200">{error}</div>}
      </form>
    </div>
  );
}
