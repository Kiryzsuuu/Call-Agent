"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { SessionConfig } from "@/components/session-config";
import { TurnDetectionTypeId } from "@/data/turn-end-types";
import { VoiceId } from "@/data/voices";
import { ModelId } from "@/data/models";
import { UseFormReturn } from "react-hook-form";
import { usePlaygroundState } from "@/hooks/use-playground-state";
import {
  useConnectionState,
  useLocalParticipant,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Button } from "@/components/ui/button";
import { defaultSessionConfig } from "@/data/playground-state";
import { useConnection } from "@/hooks/use-connection";
import { RotateCcw, Settings, BarChart3, FileText, Monitor, UtensilsCrossed, MessageCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModalitiesId } from "@/data/modalities";
import { TranscriptionModelId } from "@/data/transcription-models";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CallDashboard } from "@/components/call-dashboard";
import { PdfUploader } from "@/components/pdf-uploader";
import { LiveKitMonitor } from "@/components/livekit-monitor";
import { FoodOrderManager } from "@/components/food-order-manager";
import { WhatsAppManager } from "@/components/whatsapp-manager";
import { ActivePdfMenu } from "@/components/active-pdf-menu";
import { StaffTakeover } from "@/components/staff-takeover";
import { ResponseDelayConfig } from "@/components/response-delay-config";
import { SystemStatus } from "@/components/system-status";



export const ConfigurationFormSchema = z.object({
  model: z.nativeEnum(ModelId),
  transcriptionModel: z.nativeEnum(TranscriptionModelId),
  turnDetection: z.nativeEnum(TurnDetectionTypeId),
  modalities: z.nativeEnum(ModalitiesId),
  voice: z.nativeEnum(VoiceId),
  temperature: z.number().min(0.6).max(1.2),
  maxOutputTokens: z.number().nullable(),
  vadThreshold: z.number().min(0).max(1),
  vadSilenceDurationMs: z.number().min(0).max(5000),
  vadPrefixPaddingMs: z.number().min(0).max(5000),
});

export interface ConfigurationFormFieldProps {
  form: UseFormReturn<z.infer<typeof ConfigurationFormSchema>>;
  schema?: typeof ConfigurationFormSchema;
}

export function ConfigurationForm({ userRole }: { userRole?: string }) {
  const { pgState, dispatch } = usePlaygroundState();
  const connectionState = useConnectionState();
  const { voice, disconnect, connect } = useConnection();
  const { localParticipant } = useLocalParticipant();
  const form = useForm<z.infer<typeof ConfigurationFormSchema>>({
    resolver: zodResolver(ConfigurationFormSchema),
    defaultValues: { ...defaultSessionConfig },
    mode: "onChange",
  });
  const formValues = form.watch();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { agent } = useVoiceAssistant();

  const updateConfig = useCallback(async () => {
    const values = pgState.sessionConfig;
    const attributes: { [key: string]: string } = {
      instructions: pgState.instructions,
      voice: values.voice,
      turn_detection: JSON.stringify({
        type: values.turnDetection,
        threshold: values.vadThreshold,
        silence_duration_ms: values.vadSilenceDurationMs,
        prefix_padding_ms: values.vadPrefixPaddingMs,
      }),
      modalities: values.modalities,
      temperature: values.temperature.toString(),
      max_output_tokens: values.maxOutputTokens
        ? values.maxOutputTokens.toString()
        : "",
    };

    const hadExistingAttributes =
      Object.keys(localParticipant.attributes).length > 0;

    const onlyVoiceChanged = Object.keys(attributes).every(
      (key) =>
        key === "voice" ||
        attributes[key] === (localParticipant.attributes[key] as string),
    );

    if (onlyVoiceChanged) {
      return;
    }

    if (!agent?.identity) {
      return;
    }

    try {
      let response = await localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: "pg.updateConfig",
        payload: JSON.stringify(attributes),
      });
      let responseObj = JSON.parse(response);
      if (responseObj.changed) {
        toast({
          title: "Configuration Updated",
          description: "Your changes have been applied successfully.",
          variant: "success",
        });
      }
    } catch (e) {
      toast({
        title: "Error Updating Configuration",
        description:
          "There was an error updating your configuration. Please try again.",
        variant: "destructive",
      });
    }
  }, [
    pgState.sessionConfig,
    pgState.instructions,
    localParticipant,
    toast,
    agent,
  ]);

  const handleDebouncedUpdate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      updateConfig();
    }, 500);
  }, [updateConfig]);


  // Ambil config dari backend saat mount (semua user)
  useEffect(() => {
    fetch("http://localhost:8001/config")
      .then(res => res.json())
      .then(json => {
        if (json.data && Object.keys(json.data).length > 0) {
          dispatch({ type: "SET_SESSION_CONFIG", payload: json.data });
          form.reset(json.data);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (form.formState.isValid && form.formState.isDirty) {
      dispatch({
        type: "SET_SESSION_CONFIG",
        payload: formValues,
      });
      // Staff: update config ke backend
      if (userRole === "staff") {
        fetch("http://localhost:8001/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: formValues }),
        });
      }
    }
  }, [formValues, dispatch, form, userRole]);

  useEffect(() => {
    if (ConnectionState.Connected === connectionState) {
      handleDebouncedUpdate();
    }

    form.reset(pgState.sessionConfig);
  }, [pgState.sessionConfig, connectionState, handleDebouncedUpdate, form]);

  return (
    <div 
      className="h-full overflow-y-scroll" 
      style={{ 
        maxHeight: 'calc(100vh - 80px)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
      }}
    >
      <Tabs defaultValue="config" className="w-full">
        <div className="sticky top-0 bg-white z-10 p-3 pb-2 border-b">
          <TabsList className="grid w-full grid-cols-3 gap-1 h-auto">
            <TabsTrigger value="config" className="text-xs py-2 px-2 flex flex-col items-center gap-1">
              <Settings className="h-3 w-3" />
              <span>Config</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs py-2 px-2 flex flex-col items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="pdf" className="text-xs py-2 px-2 flex flex-col items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>PDF</span>
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-4 gap-1 h-auto mt-2">
            <TabsTrigger value="monitor" className="text-xs py-2 px-1 flex flex-col items-center gap-1">
              <Monitor className="h-3 w-3" />
              <span>Monitor</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs py-2 px-1 flex flex-col items-center gap-1">
              <UtensilsCrossed className="h-3 w-3" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs py-2 px-1 flex flex-col items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="text-xs py-2 px-1 flex flex-col items-center gap-1">
              <Users className="h-3 w-3" />
              <span>Staff</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="config" className="m-0 p-4 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-widest">
            Configuration
          </div>
          <Form {...form}>
            <SessionConfig form={form} />
          </Form>
          
          {/* Response Delay Configuration */}
          <ResponseDelayConfig />
          {pgState.sessionConfig.voice !== voice &&
            ConnectionState.Connected === connectionState && (
              <div className="flex flex-col">
                <div className="text-xs bg-neutral-100 py-2 px-2 my-2 rounded-md">
                  Your change to the voice parameter requires a reconnect.
                </div>
                <Button
                  className="w-full"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    disconnect().then(() => {
                      connect();
                    });
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Reconnect Now
                </Button>
              </div>
            )}
        </TabsContent>
        
        <TabsContent value="dashboard" className="m-0 p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-4">
            Call Dashboard
          </div>
          <div className="space-y-4">
            <SystemStatus />
            <CallDashboard />
          </div>
        </TabsContent>
        
        <TabsContent value="pdf" className="m-0 p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-4">
            PDF Upload & OCR
          </div>
          <PdfUploader onPdfSelected={() => window.dispatchEvent(new Event('refresh-active-pdf'))} />
          <ActivePdfMenuWrapper />
        </TabsContent>
        
        <TabsContent value="monitor" className="m-0 p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-4">
            LiveKit Monitoring
          </div>
          <LiveKitMonitor />
        </TabsContent>
        
        <TabsContent value="orders" className="m-0 p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-4">
            Food Orders
          </div>
          <FoodOrderManager />
        </TabsContent>
        
        <TabsContent value="whatsapp" className="m-0 p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-4">
            WhatsApp Communication
          </div>
          <WhatsAppManager />
        </TabsContent>
        
        <TabsContent value="staff" className="m-0 p-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-4">
            Staff Takeover Management
          </div>
          <StaffTakeover />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Tambahkan komponen wrapper agar ActivePdfMenu bisa refresh saat PDF dipilih
function ActivePdfMenuWrapper() {
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1);
    window.addEventListener('refresh-active-pdf', handler);
    return () => window.removeEventListener('refresh-active-pdf', handler);
  }, []);
  return <ActivePdfMenu key={refreshKey} />;
}