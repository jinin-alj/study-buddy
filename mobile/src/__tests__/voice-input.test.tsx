import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/api/client';
import { VoiceInput } from '@/features/session/voice-input';
import { useSpeechToText } from '@/speech/use-speech-to-text';

jest.mock('@/speech/use-speech-to-text', () => ({ useSpeechToText: jest.fn() }));

const mockedUseSpeechToText = jest.mocked(useSpeechToText);
const startListening = jest.fn();
const stopListening = jest.fn();
const clearTranscript = jest.fn();

function mockSpeech(overrides: Partial<ReturnType<typeof useSpeechToText>>) {
  mockedUseSpeechToText.mockReturnValue({
    isAvailable: true,
    isListening: false,
    transcript: '',
    errorMessage: null,
    startListening,
    stopListening,
    clearTranscript,
    ...overrides,
  });
}

async function renderInput(onSubmit: (text: string) => Promise<void>) {
  await render(
    <VoiceInput
      language="es-ES"
      prompt="Tap and explain it from memory"
      typingPrompt="Type your explanation from memory"
      submitLabel="Send to Pip"
      onSubmit={onSubmit}
    />,
  );
}

beforeEach(() => {
  jest.resetAllMocks();
});

it('listens in the chosen language when the microphone is tapped', async () => {
  mockSpeech({});
  await renderInput(jest.fn());

  await fireEvent.press(screen.getByRole('button', { name: 'Tap to talk' }));

  expect(startListening).toHaveBeenCalledWith('es-ES');
});

it('stops listening when tapped again', async () => {
  mockSpeech({ isListening: true, transcript: 'Plants make' });
  await renderInput(jest.fn());

  await fireEvent.press(screen.getByRole('button', { name: 'Stop talking' }));

  expect(stopListening).toHaveBeenCalled();
});

it('lets the student fix what was heard before sending', async () => {
  mockSpeech({ transcript: 'Plants make food in chlorophyll' });
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  await renderInput(onSubmit);

  await fireEvent.changeText(
    screen.getByLabelText('What Pip heard. You can fix mistakes here.'),
    'Plants make food in chloroplasts',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Send to Pip' }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Plants make food in chloroplasts'));
  expect(clearTranscript).toHaveBeenCalled();
});

it('falls back to typing when the browser cannot recognise speech', async () => {
  mockSpeech({ isAvailable: false });
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  await renderInput(onSubmit);

  expect(screen.queryByRole('button', { name: 'Tap to talk' })).toBeNull();
  await fireEvent.changeText(
    screen.getByLabelText('Type your explanation from memory'),
    '  Plants make food.  ',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Send to Pip' }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Plants make food.'));
});

it('keeps the text and shows the error when sending fails', async () => {
  mockSpeech({ transcript: 'Plants make food' });
  const onSubmit = jest
    .fn()
    .mockRejectedValue(new ApiError(503, "Your buddy can't answer right now."));
  await renderInput(onSubmit);

  await fireEvent.press(screen.getByRole('button', { name: 'Send to Pip' }));

  await waitFor(() => expect(screen.getByText("Your buddy can't answer right now.")).toBeTruthy());
  expect(clearTranscript).not.toHaveBeenCalled();
});
