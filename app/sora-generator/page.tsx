"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  ChangeEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandSelector } from "@/components/brand-selector";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Video,
  Wand2,
  Calendar,
  Download,
  Eye,
  Loader2,
  CheckCircle2,
  Plus,
  X,
  Music,
  Users,
} from "lucide-react";
import { getBrands, getBrandById } from "@/lib/actions/brands";
import { createContentItem } from "@/lib/actions/content";
import {
  getCameosByBrand,
  createCameo,
  deleteCameo,
} from "@/lib/actions/cameos";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Database } from "@/types/database";
import { CaptionEditor } from "@/components/caption-editor";
import { DEFAULT_CAPTION_STYLE } from "@/types/caption-styles";
import type { CaptionStyle } from "@/types/caption-styles";

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];
type Cameo = Database["public"]["Tables"]["cameos"]["Row"];

interface WorkflowResult {
  videoUrl: string | null;
  videoTaskId: string | null;
  videoSource?: "sora" | "upload";
  audioBase64: string;
  transcript: {
    text: string;
    words: Array<{
      text: string;
      start: number;
      end: number;
      type: string;
      characters?: Array<{ text: string; start: number; end: number }>;
    }>;
    languageCode: string;
  };
  captions: {
    segments: Array<{ text: string; start: number; end: number }>;
    srt: string;
    vtt: string;
    count: number;
  };
  title: string;
  description: string;
  tags: string[];
  thumbnailBrief: string;
  videoPrompt: string;
  voiceoverScript: string;
  alternativePrompts: string[];
  taskInfo: {
    consumeCredits?: number;
    costTime?: number;
    createTime: number;
    completeTime?: number;
  };
}

const platformOptions = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube Shorts" },
];

const aspectRatioOptions = [
  { value: "landscape", label: "Landscape (16:9)" },
  { value: "portrait", label: "Portrait (9:16)" },
];

const durationOptions = [
  { value: "10", label: "10 seconds" },
  { value: "15", label: "15 seconds" },
];

export default function SoraGeneratorPage() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<BrandRow | null>(null);
  const [cameos, setCameos] = useState<Cameo[]>([]);
  const [voices, setVoices] = useState<
    Array<{ voice_id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<"sora" | "upload">("sora");
  const [compiling, setCompiling] = useState(false);
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>("");
  const { toast } = useToast();

  // Form state
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [aspectRatio, setAspectRatio] = useState("portrait");
  const [duration, setDuration] = useState("10");
  const [voiceId, setVoiceId] = useState("");
  const [selectedCameos, setSelectedCameos] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customVoiceoverScript, setCustomVoiceoverScript] = useState("");
  const [stability, setStability] = useState("0.5");
  const [similarityBoost, setSimilarityBoost] = useState("0.75");
  const [activePanel, setActivePanel] = useState<"sora" | "upload">("sora");
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [uploadedVideoBase64, setUploadedVideoBase64] = useState("");
  const [captionStyle, setCaptionStyle] =
    useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
  const captionStyleRef = useRef<CaptionStyle>(DEFAULT_CAPTION_STYLE);

  // Cameo management state
  const [showCameoDialog, setShowCameoDialog] = useState(false);
  const [cameoName, setCameoName] = useState("");
  const [cameoDescription, setCameoDescription] = useState("");
  const [cameoVisualDescription, setCameoVisualDescription] = useState("");

  const handleCaptionStyleChange = useCallback((newStyle: CaptionStyle) => {
    setCaptionStyle(newStyle);
  }, []);

  useEffect(() => {
    captionStyleRef.current = captionStyle;
  }, [captionStyle]);

  const readFileAsBase64 = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const [, data] = result.split(",");
          resolve(data || "");
        } else {
          reject(new Error("Unable to read video file"));
        }
      };
      reader.onerror = () =>
        reject(reader.error || new Error("Unable to read video file"));
      reader.readAsDataURL(file);
    });
  }, []);

  const resetUploadedVideo = useCallback(() => {
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    setUploadedVideoFile(null);
    setUploadedVideoUrl("");
    setUploadedVideoBase64("");
  }, [uploadedVideoUrl]);

  const handleExistingVideoSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 120 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Video too large",
          description: "Please upload a video under 120MB.",
        });
        event.target.value = "";
        return;
      }

      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }

      setUploadedVideoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setUploadedVideoUrl(objectUrl);

      try {
        const base64 = await readFileAsBase64(file);
        setUploadedVideoBase64(base64);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "We couldn't read that video file. Try another format.",
        });
        resetUploadedVideo();
      }
    },
    [readFileAsBase64, toast, uploadedVideoUrl, resetUploadedVideo],
  );

  const loadBrands = useCallback(async () => {
    setLoading(true);
    const result = await getBrands();
    if (result.success && result.brands) {
      setBrands(result.brands);
      if (result.brands.length > 0) {
        setSelectedBrandId(result.brands[0].id);
      }
    }
    setLoading(false);
  }, []);

  const loadBrandDetails = useCallback(async (brandId: string) => {
    const result = await getBrandById(brandId);
    if (result.success && result.brand) {
      setSelectedBrand(result.brand);
    }
  }, []);

  const loadCameos = useCallback(async (brandId: string) => {
    const result = await getCameosByBrand(brandId);
    if (result.success) {
      setCameos(result.cameos);
    }
  }, []);

  const loadVoices = useCallback(async () => {
    try {
      const response = await fetch("/api/elevenlabs/voices");
      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices || []);
        if (data.voices?.length > 0) {
          setVoiceId(data.voices[0].voice_id);
        }
      }
    } catch (error) {
      console.error("Failed to load voices:", error);
    }
  }, []);

  useEffect(() => {
    loadBrands();
    loadVoices();
  }, [loadBrands, loadVoices]);

  useEffect(() => {
    if (selectedBrandId) {
      loadBrandDetails(selectedBrandId);
      loadCameos(selectedBrandId);
    }
  }, [selectedBrandId, loadBrandDetails, loadCameos]);

  useEffect(() => {
    return () => {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
    };
  }, [uploadedVideoUrl]);

  useEffect(() => {
    if (activePanel !== "upload") {
      resetUploadedVideo();
    }
  }, [resetUploadedVideo, activePanel]);

  const handleCreateCameo = async () => {
    if (
      !selectedBrandId ||
      !cameoName.trim() ||
      !cameoDescription.trim() ||
      !cameoVisualDescription.trim()
    ) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all cameo fields",
      });
      return;
    }

    const result = await createCameo({
      brandId: selectedBrandId,
      name: cameoName.trim(),
      description: cameoDescription.trim(),
      visualDescription: cameoVisualDescription.trim(),
    });

    if (result.success) {
      toast({
        title: "Cameo created",
        description: `@${cameoName} is ready to use in your videos`,
      });
      loadCameos(selectedBrandId);
      setShowCameoDialog(false);
      setCameoName("");
      setCameoDescription("");
      setCameoVisualDescription("");
    } else {
      toast({
        variant: "destructive",
        title: "Failed to create cameo",
        description: result.error,
      });
    }
  };

  const handleDeleteCameo = async (cameoId: string) => {
    const result = await deleteCameo(cameoId);
    if (result.success) {
      toast({ title: "Cameo deleted" });
      loadCameos(selectedBrandId);
      setSelectedCameos(selectedCameos.filter((id) => id !== cameoId));
    }
  };

  const handleGenerate = async () => {
    const mode = activePanel;

    if (!selectedBrand || !voiceId) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please select a brand and voice before generating.",
      });
      return;
    }

    if (mode === "sora" && !topic.trim()) {
      toast({
        variant: "destructive",
        title: "Add a topic",
        description:
          "Give Sora a topic or idea so it can generate the footage and metadata.",
      });
      return;
    }

    if (mode === "upload" && (!uploadedVideoFile || !uploadedVideoBase64)) {
      toast({
        variant: "destructive",
        title: "Upload a source video",
        description:
          "Choose an existing MP4/WebM file if you want to skip Sora generation.",
      });
      return;
    }

    setCurrentFlow(mode);
    setGenerating(true);
    setResult(null);
    setAudioUrl("");
    setFinalVideoUrl("");

    try {
      const selectedCameoData = cameos.filter((c) =>
        selectedCameos.includes(c.id),
      );
      const payload: Record<string, unknown> = {
        brand: {
          name: selectedBrand.name,
          mission: selectedBrand.mission,
          voice_tone: selectedBrand.voice_tone,
          target_audience: selectedBrand.target_audience,
          visual_lexicon: selectedBrand.visual_lexicon,
          dos: selectedBrand.dos,
          donts: selectedBrand.donts,
          negative_prompts: selectedBrand.negative_prompts,
        },
        platform,
        aspectRatio,
        duration,
        voiceId,
        voiceSettings: {
          stability: parseFloat(stability),
          similarity_boost: parseFloat(similarityBoost),
          use_speaker_boost: true,
        },
        cameos: selectedCameoData.map((c) => ({
          name: c.name,
          description: c.description,
          visualDescription: c.visual_description,
        })),
        captionOptions: {
          maxWordsPerCaption: captionStyle.maxWordsPerLine,
          maxCharsPerCaption: captionStyle.maxCharsPerLine,
          minDurationMs:
            captionStyle.maxWordsPerLine <= 1
              ? 180
              : Math.max(280, Math.round(280 + captionStyle.maxWordsPerLine * 60)),
        },
      };

      if (mode === "upload" && uploadedVideoBase64) {
        const derivedTopic =
          topic.trim() ||
          uploadedVideoFile?.name?.replace(/\.[^/.]+$/, "") ||
          "Existing uploaded video";
        payload.topic = derivedTopic;
        payload.existingVideoBase64 = uploadedVideoBase64;
        payload.existingVideoMimeType = uploadedVideoFile?.type || "video/mp4";
      } else {
        payload.topic = topic.trim();
      }

      if (customPrompt.trim()) {
        payload.customPrompt = customPrompt.trim();
      }
      if (customVoiceoverScript.trim()) {
        payload.customVoiceoverScript = customVoiceoverScript.trim();
      }

      const response = await fetch("/api/sora/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate video");
      }

      setResult({
        ...data.data,
        videoUrl: data.data.videoUrl ?? null,
        videoTaskId: data.data.videoTaskId ?? null,
      });

      // Convert audio base64 to blob URL for playback
      const audioBytes = atob(data.data.audioBase64);
      const audioArray = new Uint8Array(audioBytes.length);
      for (let i = 0; i < audioBytes.length; i++) {
        audioArray[i] = audioBytes.charCodeAt(i);
      }
      const audioBlob = new Blob([audioArray], { type: "audio/mpeg" });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      toast({
        title:
          mode === "upload"
            ? "Video processed successfully!"
            : "Video generated successfully!",
        description:
          mode === "upload"
            ? "Voice swap, captions, and metadata are ready."
            : "Your AI-powered video and voiceover are ready.",
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCaptions = (format: "srt" | "vtt" | "json") => {
    if (!result?.captions) return;

    try {
      let content: string;
      let extension: string;

      switch (format) {
        case "srt":
          content = result.captions.srt;
          extension = "srt";
          break;
        case "vtt":
          content = result.captions.vtt;
          extension = "vtt";
          break;
        case "json":
          content = JSON.stringify(result.captions.segments, null, 2);
          extension = "json";
          break;
      }

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.title.slice(0, 30)}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Captions downloaded",
        description: `${result.captions.count} caption segments in ${format.toUpperCase()} format`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to download captions",
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleDownloadAudio = () => {
    if (!audioUrl || !result) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${result.title.slice(0, 30)}-voiceover.mp3`;
    a.click();
  };

  const sourceVideoUrl = useCallback(() => {
    if (!result) return "";
    if (result.videoSource === "upload") {
      return uploadedVideoUrl;
    }
    if (result.videoUrl) {
      return `/api/video/proxy?url=${encodeURIComponent(result.videoUrl)}`;
    }
    return "";
  }, [result, uploadedVideoUrl]);

  const compileVideoWithCurrentStyle = useCallback(
    async (silent: boolean = false) => {
      if (!result) return;
      const sourceUrl = sourceVideoUrl();

      if (!sourceUrl) {
        if (!silent) {
          toast({
            variant: "destructive",
            title: "Source video unavailable",
            description:
              "Re-upload or regenerate your clip before rendering the final version.",
          });
        }
        return;
      }

      setCompiling(true);
      setCompilationProgress(0);
      setFinalVideoUrl("");

      try {
        const { compileVideoWithCaptions } = await import(
          "@/lib/video-compiler-advanced"
        );
        const finalBlob = await compileVideoWithCaptions({
          videoUrl: sourceUrl,
          audioBase64: result.audioBase64,
          captions: result.captions.segments,
          style: captionStyleRef.current,
          onProgress: (progress) => {
            setCompilationProgress(Math.round(progress * 100));
          },
        });

        const url = URL.createObjectURL(finalBlob);
        setFinalVideoUrl(url);

        if (!silent) {
          toast({
            title: "Video compiled successfully!",
            description: "Your final video with stylized captions is ready.",
          });
        }
      } catch (error) {
        console.error("Compilation error:", error);
        if (!silent) {
          toast({
            variant: "destructive",
            title: "Compilation failed",
            description:
              error instanceof Error ? error.message : "An error occurred",
          });
        }
      } finally {
        setCompiling(false);
        setCompilationProgress(0);
      }
    },
    [result, sourceVideoUrl, toast],
  );

  useEffect(() => {
    if (!result) return;
    compileVideoWithCurrentStyle(true);
  }, [result, compileVideoWithCurrentStyle]);

  const handleScheduleToCalendar = async () => {
    if (!result || !selectedBrandId) return;

    try {
      const dateTarget = format(new Date(), "yyyy-MM-dd");

      const createResult = await createContentItem({
        brandId: selectedBrandId,
        dateTarget,
        platform,
        status: "generated",
      });

      if (!createResult.success || !createResult.item) {
        throw new Error(createResult.error || "Failed to create content item");
      }

      const { updateContentItemDetails } = await import(
        "@/lib/actions/content"
      );
      const updateResult = await updateContentItemDetails(
        createResult.item.id,
        {
          notes: `${result.title}\n\n${result.voiceoverScript}\n\nTags: ${result.tags.join(", ")}\n\nTranscript:\n${result.transcript.text}`,
          attachments: {
            videoUrl:
              result.videoUrl ||
              (result.videoSource === "upload" ? "(uploaded locally)" : ""),
            videoSource: result.videoSource,
            audioBase64: result.audioBase64,
            title: result.title,
            description: result.description,
            tags: result.tags,
            thumbnailBrief: result.thumbnailBrief,
            videoPrompt: result.videoPrompt,
            voiceoverScript: result.voiceoverScript,
            taskId: result.videoTaskId,
            transcript: result.transcript,
            captions: result.captions,
          },
        },
      );

      if (updateResult.success) {
        toast({
          title: "Scheduled to calendar",
          description: `Content added to ${format(new Date(), "PPP")}`,
        });
        window.dispatchEvent(
          new CustomEvent("content-items-updated", {
            detail: { brandId: selectedBrandId },
          }),
        );
      } else {
        throw new Error(
          updateResult.error || "Failed to update content details",
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to schedule",
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const soraFlowBody =
    activePanel === "sora" ? (
      <div className="space-y-4 border-t border-white/10 p-6">
        <div>
          <Label htmlFor="topic" className="text-[color:var(--text)]">
            Topic / Idea
          </Label>
          <Input
            id="topic"
            placeholder="e.g., 5 productivity tips for creators"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="glass border-white/10 bg-transparent text-[color:var(--text)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="platform" className="text-[color:var(--text)]">
              Platform
            </Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="glass border-white/10 bg-transparent text-[color:var(--text)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass border-white/10 bg-[var(--surface)]">
                {platformOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="aspectRatio" className="text-[color:var(--text)]">
              Aspect Ratio
            </Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="glass border-white/10 bg-transparent text-[color:var(--text)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass border-white/10 bg-[var(--surface)]">
                {aspectRatioOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="duration" className="text-[color:var(--text)]">
            Duration
          </Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="glass border-white/10 bg-transparent text-[color:var(--text)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 bg-[var(--surface)]">
              {durationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="voice" className="text-[color:var(--text)]">
            Voice (ElevenLabs)
          </Label>
          <Select value={voiceId} onValueChange={setVoiceId}>
            <SelectTrigger className="glass border-white/10 bg-transparent text-[color:var(--text)]">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 bg-[var(--surface)]">
              {voices.map((voice) => (
                <SelectItem key={voice.voice_id} value={voice.voice_id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stability" className="text-[color:var(--text)]">
              Stability: {stability}
            </Label>
            <Input
              id="stability"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={stability}
              onChange={(e) => setStability(e.target.value)}
              className="glass"
            />
          </div>
          <div>
            <Label htmlFor="similarity" className="text-[color:var(--text)]">
              Similarity: {similarityBoost}
            </Label>
            <Input
              id="similarity"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={similarityBoost}
              onChange={(e) => setSimilarityBoost(e.target.value)}
              className="glass"
            />
          </div>
        </div>

        {/* Cameos */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-[color:var(--text)]">
              Cameos (Optional)
            </Label>
            <Dialog open={showCameoDialog} onOpenChange={setShowCameoDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[color:hsl(var(--accent))]"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  New Cameo
                </Button>
              </DialogTrigger>
              <DialogContent className="glass max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-[color:var(--text)]">
                    Create Character Cameo
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[color:var(--text)]">
                      Name (use @name in prompts)
                    </Label>
                    <Input
                      placeholder="e.g., alex"
                      value={cameoName}
                      onChange={(e) => setCameoName(e.target.value)}
                      className="glass border-white/10 bg-transparent text-[color:var(--text)]"
                    />
                  </div>
                  <div>
                    <Label className="text-[color:var(--text)]">
                      Description
                    </Label>
                    <Input
                      placeholder="e.g., Tech entrepreneur character"
                      value={cameoDescription}
                      onChange={(e) => setCameoDescription(e.target.value)}
                      className="glass border-white/10 bg-transparent text-[color:var(--text)]"
                    />
                  </div>
                  <div>
                    <Label className="text-[color:var(--text)]">
                      Visual Description
                    </Label>
                    <Textarea
                      placeholder="e.g., 30s male with short dark hair, wearing casual business attire, friendly smile"
                      value={cameoVisualDescription}
                      onChange={(e) =>
                        setCameoVisualDescription(e.target.value)
                      }
                      rows={3}
                      className="glass border-white/10 bg-transparent text-[color:var(--text)]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCameoDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCameo}
                    className="bg-[color:hsl(var(--accent))]"
                  >
                    Create Cameo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-2">
            {cameos.map((cameo) => (
              <Badge
                key={cameo.id}
                variant={
                  selectedCameos.includes(cameo.id) ? "default" : "outline"
                }
                className="cursor-pointer transition hover:bg-[color:hsl(var(--accent))]/20"
                onClick={() =>
                  setSelectedCameos((prev) =>
                    prev.includes(cameo.id)
                      ? prev.filter((id) => id !== cameo.id)
                      : [...prev, cameo.id],
                  )
                }
              >
                <Users className="mr-1 h-3 w-3" />@{cameo.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCameo(cameo.id);
                  }}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {cameos.length === 0 && (
              <p className="text-sm text-[color:var(--muted-text)]">
                No cameos yet. Create one to get started!
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="customPrompt" className="text-[color:var(--text)]">
            Custom Video Prompt (Optional)
          </Label>
          <Textarea
            id="customPrompt"
            placeholder="Override AI-generated video prompt..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={2}
            className="glass border-white/10 bg-transparent text-[color:var(--text)]"
          />
        </div>

        <div>
          <Label
            htmlFor="customVoiceoverScript"
            className="text-[color:var(--text)]"
          >
            Custom Voiceover Script (Optional)
          </Label>
          <Textarea
            id="customVoiceoverScript"
            placeholder="Override AI-generated voiceover script..."
            value={customVoiceoverScript}
            onChange={(e) => setCustomVoiceoverScript(e.target.value)}
            rows={3}
            className="glass border-white/10 bg-transparent text-[color:var(--text)]"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || !topic.trim() || !voiceId || !selectedBrandId}
          className="w-full bg-[color:hsl(var(--accent))] text-white hover:bg-[color:hsl(var(--accent))]/90"
          size="lg"
        >
          {generating && currentFlow === "sora" ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating... (3-7 min)
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Generate Video + Voice
            </>
          )}
        </Button>
      </div>
    ) : null;

  const uploadFlowBody =
    activePanel === "upload" ? (
      <div className="space-y-4 border-t border-white/10 p-6">
        <div>
          <Label className="text-[color:var(--text)]">Video file</Label>
          <Input
            type="file"
            accept="video/mp4,video/webm"
            onChange={handleExistingVideoSelect}
            className="cursor-pointer border-white/20 text-[color:var(--text)]"
          />
          {uploadedVideoUrl && (
            <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <video
                src={uploadedVideoUrl}
                controls
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <p className="mt-2 text-xs text-[color:var(--muted-text)]">
            Max 120MB · Recommended length 10-15 seconds.
          </p>
        </div>

        <div>
          <Label htmlFor="platform-upload" className="text-[color:var(--text)]">
            Platform
          </Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="glass border-white/10 bg-transparent text-[color:var(--text)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 bg-[var(--surface)]">
              {platformOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="voice-upload" className="text-[color:var(--text)]">
            Voice (ElevenLabs)
          </Label>
          <Select value={voiceId} onValueChange={setVoiceId}>
            <SelectTrigger className="glass border-white/10 bg-transparent text-[color:var(--text)]">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 bg-[var(--surface)]">
              {voices.map((voice) => (
                <SelectItem key={voice.voice_id} value={voice.voice_id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="stability-upload"
              className="text-[color:var(--text)]"
            >
              Stability: {stability}
            </Label>
            <Input
              id="stability-upload"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={stability}
              onChange={(e) => setStability(e.target.value)}
              className="glass"
            />
          </div>
          <div>
            <Label
              htmlFor="similarity-upload"
              className="text-[color:var(--text)]"
            >
              Similarity: {similarityBoost}
            </Label>
            <Input
              id="similarity-upload"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={similarityBoost}
              onChange={(e) => setSimilarityBoost(e.target.value)}
              className="glass"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={
            generating || !uploadedVideoFile || !voiceId || !selectedBrandId
          }
          className="w-full bg-[color:hsl(var(--accent))] text-white hover:bg-[color:hsl(var(--accent))]/90"
          size="lg"
        >
          {generating && currentFlow === "upload" ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing video...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Process Uploaded Video
            </>
          )}
        </Button>
      </div>
    ) : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[color:hsl(var(--accent))]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="glass p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:hsl(var(--accent))]/20">
            <Video className="h-6 w-6 text-[color:hsl(var(--accent))]" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted-text)]">
              AI Video Studio
            </p>
            <h1 className="text-3xl font-semibold text-[color:var(--text)]">
              Sora 2 Generator
            </h1>
            <p className="mt-1 text-sm text-[color:var(--muted-text)]">
              Script → Sora 2 Video → ElevenLabs Voice → TikTok Captions (2
              words/line)
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Panel */}
        <div className="space-y-6">
          <div>
            <Label className="text-[color:var(--text)]">Brand</Label>
            <BrandSelector
              brands={brands}
              selectedBrandId={selectedBrandId}
              onBrandChange={setSelectedBrandId}
            />
          </div>

          {/* Sora 2 Workflow */}
          <Card className="overflow-hidden border border-white/10 bg-[color:var(--surface)]/30">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActivePanel("sora")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActivePanel("sora");
                }
              }}
              className="flex w-full cursor-pointer items-center justify-between gap-4 bg-white/2 px-4 py-3 text-left transition hover:bg-white/5 focus-visible:outline focus-visible:outline-[color:hsl(var(--accent))]"
            >
              <div>
                <p className="text-sm font-semibold text-[color:var(--text)]">
                  Generate with Sora 2
                </p>
                <p className="text-xs text-[color:var(--muted-text)]">
                  AI script → Sora video → ElevenLabs voice
                </p>
              </div>
            </div>
            {soraFlowBody}
          </Card>

          {/* Upload Workflow */}
          <Card className="overflow-hidden border border-white/10 bg-[color:var(--surface)]/30">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActivePanel("upload")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActivePanel("upload");
                }
              }}
              className="flex w-full cursor-pointer items-center justify-between gap-4 bg-white/2 px-4 py-3 text-left transition hover:bg-white/5 focus-visible:outline focus-visible:outline-[color:hsl(var(--accent))]"
            >
              <div>
                <p className="text-sm font-semibold text-[color:var(--text)]">
                  Start from existing video
                </p>
                <p className="text-xs text-[color:var(--muted-text)]">
                  Upload MP4/WebM → ElevenLabs voice → AI captions
                </p>
              </div>
            </div>
            {uploadFlowBody}
          </Card>

          {/* Caption Editor - TikTok Quality */}
          <CaptionEditor
            videoUrl={sourceVideoUrl()}
            captionSegments={result?.captions.segments || []}
            onStyleChange={handleCaptionStyleChange}
            initialStyle={captionStyle}
          />
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {!result && !generating && (
            <Card className="flex h-full min-h-[400px] items-center justify-center p-12">
              <div className="text-center">
                <Video className="mx-auto h-16 w-16 text-[color:var(--muted-text)]" />
                <p className="mt-4 text-sm text-[color:var(--muted-text)]">
                  Configure parameters and generate
                </p>
              </div>
            </Card>
          )}

          {generating && (
            <Card className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-[color:hsl(var(--accent))]" />
                  <p className="mt-4 font-semibold text-[color:var(--text)]">
                    Generating your content...
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--muted-text)]">
                    {currentFlow === "sora"
                      ? "This may take 3-7 minutes while Sora renders the clip."
                      : "This may take 30-60 seconds depending on the upload size."}
                  </p>
                </div>
                <div className="space-y-3">
                  {currentFlow === "sora" ? (
                    <>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                        <p className="text-sm text-[color:var(--text)]">
                          Script generation complete
                        </p>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-[color:hsl(var(--accent))]" />
                        <p className="text-sm text-[color:var(--text)]">
                          Generating video with Sora 2...
                        </p>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-40">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full border border-[color:var(--muted-text)]" />
                        <p className="text-sm text-[color:var(--text)]">
                          Voice enhancement with ElevenLabs
                        </p>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-40">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full border border-[color:var(--muted-text)]" />
                        <p className="text-sm text-[color:var(--text)]">
                          Generating captions
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                        <p className="text-sm text-[color:var(--text)]">
                          Video uploaded
                        </p>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-[color:hsl(var(--accent))]" />
                        <p className="text-sm text-[color:var(--text)]">
                          Applying voice with ElevenLabs...
                        </p>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-40">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full border border-[color:var(--muted-text)]" />
                        <p className="text-sm text-[color:var(--text)]">
                          Generating captions
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}

          {result && (
            <>
              <Card className="overflow-hidden border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-[color:var(--text)]">
                    <Video className="h-5 w-5 text-[color:hsl(var(--accent))]" />
                    Final Video
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => compileVideoWithCurrentStyle()}
                    disabled={compiling}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Recompile
                  </Button>
                </div>
                <div className="mt-4 aspect-video overflow-hidden rounded-lg border border-white/5 bg-black">
                  {finalVideoUrl ? (
                    <video
                      src={finalVideoUrl}
                      controls
                      className="h-full w-full"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-[color:var(--muted-text)]">
                      <Loader2 className="h-8 w-8 animate-spin text-[color:hsl(var(--accent))]" />
                      <p>
                        {compiling
                          ? `Rendering captions... ${compilationProgress}%`
                          : "Preparing final video..."}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!finalVideoUrl}
                    onClick={() =>
                      finalVideoUrl && window.open(finalVideoUrl, "_blank")
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!finalVideoUrl}
                    onClick={() => {
                      if (!finalVideoUrl) return;
                      const a = document.createElement("a");
                      a.href = finalVideoUrl;
                      a.download = `${result.title.slice(0, 30)}-final.webm`;
                      a.click();
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAudio}
                    disabled={!audioUrl}
                  >
                    <Music className="mr-2 h-4 w-4" />
                    Voiceover
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadCaptions("vtt")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Captions (VTT)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadCaptions("srt")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Captions (SRT)
                  </Button>
                </div>
              </Card>

              {/* Metadata */}
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-[color:var(--text)]">
                  Metadata
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[color:var(--muted-text)]">
                      Title
                    </Label>
                    <p className="mt-1 font-medium text-[color:var(--text)]">
                      {result.title}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[color:var(--muted-text)]">
                      Voiceover Script
                    </Label>
                    <p className="mt-1 text-sm text-[color:var(--text)]">
                      {result.voiceoverScript}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[color:var(--muted-text)]">
                      Description
                    </Label>
                    <p className="mt-1 text-sm text-[color:var(--text)]">
                      {result.description}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[color:var(--muted-text)]">
                      Tags
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-[color:var(--muted-text)]">
                      Video Prompt Used
                    </Label>
                    <p className="mt-1 text-xs text-[color:var(--text)]">
                      {result.videoPrompt}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="space-y-3 p-6">
                <h3 className="text-lg font-semibold text-[color:var(--text)]">
                  Next Steps
                </h3>
                {compiling && (
                  <div className="space-y-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-[color:hsl(var(--accent))] transition-all duration-300"
                        style={{ width: `${compilationProgress}%` }}
                      />
                    </div>
                    <p className="text-center text-xs text-[color:var(--muted-text)]">
                      Rendering video with your current caption style...
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleScheduleToCalendar}
                  className="w-full bg-[color:hsl(var(--accent))] text-white hover:bg-[color:hsl(var(--accent))]/90"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule to Calendar
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-white/10 bg-white/5 text-[color:var(--text)] hover:bg-white/10"
                  onClick={() => {
                    setResult(null);
                    setFinalVideoUrl("");
                    setAudioUrl("");
                  }}
                >
                  Generate Another Video
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
