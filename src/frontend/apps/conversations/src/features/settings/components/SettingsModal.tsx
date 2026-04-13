import { Input, Modal, ModalSize } from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

import { Box, StyledLink, Text, ToggleSwitch, useToast } from '@/components';
import { useUserUpdate } from '@/core/api/useUserUpdate';
import { useCunninghamTheme } from '@/cunningham';
import { useAuthQuery } from '@/features/auth/api';

interface SettingsModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export const SettingsModal = ({ onClose, isOpen }: SettingsModalProps) => {
  const { t } = useTranslation();
  const { data: user } = useAuthQuery();
  const { mutateAsync: updateUser, isPending } = useUserUpdate();
  const { showToast } = useToast();
  const { isDarkMode, toggleDarkMode } = useCunninghamTheme();

  const [dataEducationApiKey, setDataEducationApiKey] = useState(user?.data_education_api_key || '');

  useEffect(() => {
    if (user?.data_education_api_key) {
      setDataEducationApiKey(user.data_education_api_key);
    }
  }, [user]);

  const handleDataEducationApiKeyChange = async (newKey: string) => {
    if (!user) return;

    try {
      await updateUser({
        id: user.id,
        data_education_api_key: newKey,
      });
      showToast('success', t('API Key updated'), 'check_circle', 3000);
    } catch (error) {
      console.error('Error updating API key:', error);
      showToast('error', t('Failed to update API key'), 'error', 3000);
    }
  };

  const handleToggleChange = async () => {
    if (!user) {
      return;
    }

    try {
      await updateUser({
        id: user.id,
        allow_conversation_analytics: !user.allow_conversation_analytics,
      });

      // Toast de succès
      showToast(
        'success',
        user.allow_conversation_analytics
          ? t('Conversation analysis disabled')
          : t('Conversation analysis enabled'),
        'check_circle',
        3000,
      );
    } catch (error) {
      console.error('Error updating user settings:', error);

      // Toast d'erreur
      showToast('error', t('Failed to update settings'), 'error', 3000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      closeOnClickOutside
      onClose={onClose}
      size={ModalSize.MEDIUM}
      title={t('Assistant settings')}
    >
      <Box aria-label={t('Assistant settings')}>
        <Box $justify="space-between">
          <Box $gap="2xs">
            <Text
              $size="xs"
              $weight="400"
              $theme="greyscale"
              $variation="600"
              $padding={{ top: 'sm', bottom: 'sm' }}
            >
              {t(
                'The Assistant is a sovereign AI for public servants. It helps with daily tasks (rephrasing, summarising, translating, information search). Your data stays in France on secure, state-compliant infrastructure and is never used for commercial purposes.',
              )}
            </Text>

            <Text
              $size="md"
              $weight="500"
              $theme="greyscale"
              $variation="850"
              $padding={{ top: 'xs' }}
            >
              {t('Allow conversation analysis')}
            </Text>
          </Box>
          <Box $direction="row" $justify="space-between" $align="flex-start">
            <Box $css="max-width: 70%;">
              <Text
                $css={`
                  display: inline-block;
                `}
                $size="xs"
                $theme="greyscale"
                $variation="600"
                $weight="400"
              >
                {t(
                  'If enabled, this allows us to analyse your exchanges to improve the Assistant. If disabled, all conversations remain confidential and are not used in any way. ',
                )}
                <StyledLink
                  $css={`
                    display: inline-block;
                  `}
                  target="_blank"
                  href="https://docs.numerique.gouv.fr/docs/53d1dfb9-481d-4a68-b75c-7208c03d4dec/"
                >
                  <Text
                    $css={`
                    text-decoration: underline !important;
                  `}
                    $size="xs"
                    $theme="greyscale"
                    $variation="600"
                    $weight="400"
                  >
                    {t('Learn more about data usage.')}
                  </Text>
                </StyledLink>
              </Text>
            </Box>
            <ToggleSwitch
              checked={user?.allow_conversation_analytics ?? false}
              onChange={() => void handleToggleChange()}
              disabled={isPending}
              aria-label={t('Allow conversation analysis')}
            />
          </Box>

          <Box $gap="2xs" $padding={{ top: 'md' }}>
            <Text
              $size="md"
              $weight="500"
              $theme="greyscale"
              $variation="850"
            >
              {t('Data Education (Huwise)')}
            </Text>
            <Box $css="max-width: 100%;">
              <Text
                $size="xs"
                $theme="greyscale"
                $variation="600"
                $weight="400"
                $padding={{ bottom: 'xs' }}
              >
                {t('Configure your API key to interact with Data Education through the assistant.')}
              </Text>
              <Input
                label={t('API Key')}
                type="password"
                value={dataEducationApiKey}
                onChange={(e) => setDataEducationApiKey(e.target.value)}
                onBlur={() => {
                  if (dataEducationApiKey !== user?.data_education_api_key) {
                    void handleDataEducationApiKeyChange(dataEducationApiKey);
                  }
                }}
                disabled={isPending}
                fullWidth
              />
            </Box>
          </Box>

          <Box
            $display="block"
            $justify="space-between"
            $align="flex-end"
            $gap="2xs"
            $padding={{ top: 'md' }}
            $css="min-width: 100%;"
          >
            <Box
              $direction="row"
              $justify="space-between"
              $css="min-width: 70%;"
            >
              <Box $css="min-width: 70%;">
                <Text
                  $size="md"
                  $weight="500"
                  $theme="greyscale"
                  $variation="850"
                >
                  {t('Dark mode')}
                </Text>
              </Box>
              <ToggleSwitch
                checked={isDarkMode}
                onChange={() => toggleDarkMode()}
                aria-label={t('Dark mode')}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};
