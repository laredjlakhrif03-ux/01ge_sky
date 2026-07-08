import os
import asyncio
import urllib.request
import edge_tts
from moviepy import VideoFileClip, concatenate_videoclips, AudioFileClip, CompositeAudioClip
import moviepy.video.fx as vfx
import moviepy.audio.fx as afx

# Configure paths
WORKSPACE = r"c:\Users\PC STORE MOSTA\01ge_sky"
TEMP_DIR = os.path.join(WORKSPACE, "temp_assets")
INPUT_VIDEO = os.path.join(WORKSPACE, "فيديو توضيحي لعمل المنصة .mp4")
OUTPUT_VIDEO = os.path.join(WORKSPACE, "demo_ge_sky.mp4")
BG_MUSIC_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
BG_MUSIC_PATH = os.path.join(TEMP_DIR, "bg_music.mp3")

# Define segments: (start_sec, end_sec, script_text)
SEGMENTS_DATA = [
    {
        "id": 1,
        "start": 0,
        "end": 38,
        "text": "أهلاً بكم في منصة جي إي سكاي، الحل الرقمي الشامل والأصل للذكاء الاصطناعي، الذي يعيد تعريف إدارة التجارة الإلكترونية والتسويق الرقمي بالكامل. دعونا نلقي نظرة سريعة على كيفية عمل هذه المنصة الذكية."
    },
    {
        "id": 2,
        "start": 38,
        "end": 180,
        "text": "تبدأ التجربة من لوحة التحكم التفاعلية، حيث يمكنك مراقبة كل شيء لحظة بلحظة: من إحصائيات المبيعات، والطلبات، إلى قرارات وكلاء الذكاء الاصطناعي. هنا، يمكنك بسهولة إنشاء متجر جديد وإدارة منتجاتك بمرونة عالية."
    },
    {
        "id": 3,
        "start": 180,
        "end": 350,
        "text": "ومن خلال منظومة الحملات التسويقية واستوديو المحتوى، يقوم الذكاء الاصطناعي بإنشاء حملات مخصصة وكتابة نصوص إعلانية وتوليد محتوى متعدد اللغات يتناسب تماماً مع هوية علامتك التجارية والجمهور المستهدف."
    },
    {
        "id": 4,
        "start": 350,
        "end": 500,
        "text": "الميزة الفريدة للمنصة هي نموذج إيه تو إيه، حيث تتواصل وكلاء الذكاء الاصطناعي المستقلة وتتبادل البيانات وتتخذ القرارات التشغيلية تلقائياً. كما تتيح لك أداة المحاكاة اختبار سيناريوهات السوق مسبقاً وتعديل الاستراتيجيات."
    },
    {
        "id": 5,
        "start": 500,
        "end": 590,
        "text": "وتتكامل المنصة مع بوابات الدفع العالمية والشركات اللوجستية لمتابعة الشحنات وتأكيد المعاملات المالية وإصدار الفواتير تلقائياً لضمان سلاسة العمليات من البداية وحتى النهاية."
    },
    {
        "id": 6,
        "start": 590,
        "end": 632,
        "text": "منصة جي إي سكاي ليست مجرد أداة لإدارة متجرك، بل هي شريكك الذكي للنمو المستمر والتوسع نحو العالمية بأقل التكاليف التشغيلية. ابدأ رحلتك اليوم مع جي إي سكاي وحلق بأعمالك في السماء."
    }
]

async def download_bg_music():
    if not os.path.exists(BG_MUSIC_PATH):
        print("Downloading background music...")
        try:
            # Add user-agent to avoid HTTP 403 Forbidden issues
            req = urllib.request.Request(
                BG_MUSIC_URL, 
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req) as response, open(BG_MUSIC_PATH, 'wb') as out_file:
                out_file.write(response.read())
            print("Background music downloaded successfully.")
        except Exception as e:
            print(f"Failed to download background music: {e}. Generating silent backup audio...")
    else:
        print("Background music already exists.")

async def generate_voiceovers():
    print("Generating Arabic voiceovers...")
    voice = "ar-SA-HamedNeural"  # Professional Arabic male voice
    
    for seg in SEGMENTS_DATA:
        seg_audio_path = os.path.join(TEMP_DIR, f"voiceover_{seg['id']}.mp3")
        seg["audio_path"] = seg_audio_path
        
        # Only generate if it doesn't exist
        if not os.path.exists(seg_audio_path):
            print(f"Generating voiceover for Segment {seg['id']}...")
            communicate = edge_tts.Communicate(seg["text"], voice)
            await communicate.save(seg_audio_path)
            print(f"Segment {seg['id']} voiceover generated.")
        else:
            print(f"Segment {seg['id']} voiceover already exists.")

def process_video():
    print("Loading source video...")
    full_clip = VideoFileClip(INPUT_VIDEO)
    
    processed_segments = []
    
    for seg in SEGMENTS_DATA:
        print(f"\nProcessing Segment {seg['id']}...")
        voiceover_path = seg["audio_path"]
        
        # Load the voiceover audio to get its duration
        vo_audio = AudioFileClip(voiceover_path)
        vo_duration = vo_audio.duration
        print(f"Voiceover duration: {vo_duration:.2f} seconds")
        
        # Slice corresponding video segment
        orig_start = seg["start"]
        orig_end = seg["end"]
        orig_duration = orig_end - orig_start
        
        # Subclip the original video
        sub_clip = full_clip.subclipped(orig_start, orig_end)
        
        # Speed multiplier to match the voiceover duration exactly
        speed_factor = orig_duration / vo_duration
        print(f"Original duration: {orig_duration}s | Target duration: {vo_duration:.2f}s | Speed factor: {speed_factor:.2f}x")
        
        # Apply speed multiplier and remove original audio
        fast_clip = sub_clip.with_effects([vfx.MultiplySpeed(speed_factor)])
        fast_clip = fast_clip.without_audio()
        
        # Embed the voiceover audio
        fast_clip = fast_clip.with_audio(vo_audio)
        processed_segments.append(fast_clip)
        
    # Concatenate all segments
    print("\nConcatenating segments...")
    final_video = concatenate_videoclips(processed_segments, method="compose")
    final_duration = final_video.duration
    print(f"Total video duration: {final_duration:.2f} seconds ({final_duration/60:.2f} minutes)")
    
    # Mix background music
    if os.path.exists(BG_MUSIC_PATH):
        print("Mixing background music...")
        bg_music = AudioFileClip(BG_MUSIC_PATH).subclipped(0, final_duration)
        # Reduce volume to 10% so the voiceover is clear
        bg_music = bg_music.with_effects([afx.MultiplyVolume(0.10)])
        
        # Combine voiceovers and background music
        mixed_audio = CompositeAudioClip([final_video.audio, bg_music])
        final_video = final_video.with_audio(mixed_audio)
    else:
        print("Background music file not found. Rendering without background music.")

    # Write the output file
    print("Rendering final video...")
    # Using libx264 and aac for high compatibility
    final_video.write_videofile(
        OUTPUT_VIDEO,
        fps=24,
        codec="libx264",
        audio_codec="aac",
        temp_audiofile=os.path.join(TEMP_DIR, "temp-audio.m4a"),
        remove_temp=True
    )
    
    # Close clips to release resources
    final_video.close()
    full_clip.close()
    print(f"Video created successfully: {OUTPUT_VIDEO}")

async def main():
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR)
        
    await download_bg_music()
    await generate_voiceovers()
    process_video()

if __name__ == "__main__":
    asyncio.run(main())
