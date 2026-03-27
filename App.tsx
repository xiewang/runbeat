import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { StatusBar } from 'expo-status-bar';
import { musicLibrary, MusicTrack } from './src/utils/MusicLibrary';
import { musicPlayer } from './src/utils/MusicPlayer';
import { cadenceDetector } from './src/utils/CadenceDetector';

export default function App() {
  // 状态
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  
  // 步频相关
  const [cadence, setCadence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  
  // 设置
  const [autoSync, setAutoSync] = useState(true);
  const [beatMix, setBeatMix] = useState(true);
  const [volume, setVolume] = useState(0.8);

  // 初始化
  useEffect(() => {
    loadMusicLibrary();
    
    // 设置回调
    musicPlayer.setOnTrackChange(setCurrentTrack);
    
    return () => {
      musicPlayer.dispose();
      cadenceDetector.stop();
    };
  }, []);

  // 加载音乐库
  const loadMusicLibrary = async () => {
    setIsLoading(true);
    try {
      const loadedTracks = await musicLibrary.loadLocalMusic();
      setTracks(loadedTracks);
      
      if (loadedTracks.length === 0) {
        Alert.alert('提示', '未找到本地音乐文件');
      }
    } catch (error) {
      Alert.alert('错误', '无法访问音乐库，请检查权限');
    } finally {
      setIsLoading(false);
    }
  };

  // 分析 BPM
  const analyzeBPM = async () => {
    if (tracks.length === 0) {
      Alert.alert('提示', '请先加载音乐');
      return;
    }
    
    setAnalyzing(true);
    setAnalyzeProgress(0);
    
    try {
      await musicLibrary.analyzeAllBPM((current, total) => {
        setAnalyzeProgress(current / total);
      });
      
      // 刷新列表
      setTracks(musicLibrary.getAllTracks());
      Alert.alert('完成', `已分析 ${tracks.length} 首音乐的 BPM`);
    } catch (error) {
      Alert.alert('错误', 'BPM 分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  // 播放音乐
  const playTrack = async (track: MusicTrack) => {
    try {
      await musicPlayer.playTrack(track);
      setIsPlaying(true);
      
      // 同步当前步频
      if (cadence > 0) {
        musicPlayer.setTargetBPM(cadence);
      }
    } catch (error) {
      Alert.alert('播放失败', '无法播放该曲目');
    }
  };

  // 切换播放/暂停
  const togglePlayback = async () => {
    await musicPlayer.togglePlayback();
    setIsPlaying(!isPlaying);
  };

  // 开始/停止步频检测
  const toggleCadenceDetection = async () => {
    if (isDetecting) {
      cadenceDetector.stop();
      setIsDetecting(false);
      setCadence(0);
    } else {
      try {
        await cadenceDetector.start((newCadence) => {
          setCadence(newCadence);
          setStepCount(cadenceDetector.getStepCount());
          
          // 自动同步音乐
          if (autoSync && newCadence > 0) {
            musicPlayer.setTargetBPM(newCadence);
            
            // 如果当前没有播放或 BPM 差异太大，切换音乐
            if (!currentTrack || Math.abs(currentTrack.bpm - newCadence) > 10) {
              const bestMatch = musicLibrary.findBestMatch(newCadence, currentTrack?.id);
              if (bestMatch && bestMatch.id !== currentTrack?.id) {
                playTrack(bestMatch);
              }
            }
          }
        });
        setIsDetecting(true);
        cadenceDetector.reset();
      } catch (error) {
        Alert.alert('错误', '无法启动步频检测，请检查传感器权限');
      }
    }
  };

  // 渲染音乐项
  const renderTrackItem = ({ item }: { item: MusicTrack }) => (
    <TouchableOpacity
      style={[
        styles.trackItem,
        currentTrack?.id === item.id && styles.trackItemActive,
      ]}
      onPress={() => playTrack(item)}
    >
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <View style={styles.trackMeta}>
        <Text style={styles.trackBPM}>
          {item.bpm > 0 ? `${item.bpm} BPM` : '未分析'}
        </Text>
        {currentTrack?.id === item.id && isPlaying && (
          <View style={styles.playingIndicator}>
            <ActivityIndicator size="small" color="#1DB954" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* 标题 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RunBeat</Text>
        <Text style={styles.headerSubtitle}>步频同步音乐播放器</Text>
      </View>

      {/* 步频显示 */}
      <View style={styles.cadenceSection}>
        <View style={styles.cadenceDisplay}>
          <Text style={styles.cadenceValue}>{cadence}</Text>
          <Text style={styles.cadenceLabel}>当前步频 (BPM)</Text>
        </View>
        <View style={styles.cadenceStats}>
          <Text style={styles.statText}>步数: {stepCount}</Text>
          <TouchableOpacity
            style={[styles.detectButton, isDetecting && styles.detectButtonActive]}
            onPress={toggleCadenceDetection}
          >
            <Text style={styles.detectButtonText}>
              {isDetecting ? '停止检测' : '开始跑步'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 当前播放 */}
      {currentTrack && (
        <View style={styles.nowPlaying}>
          <Text style={styles.nowPlayingLabel}>正在播放</Text>
          <Text style={styles.nowPlayingTitle} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.nowPlayingBPM}>
            音乐 {currentTrack.bpm} BPM → 目标 {cadence} BPM
          </Text>
          <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
            <Text style={styles.playButtonText}>
              {isPlaying ? '⏸ 暂停' : '▶ 继续'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 设置 */}
      <View style={styles.settings}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>自动同步音乐</Text>
          <Switch value={autoSync} onValueChange={setAutoSync} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>节拍叠加</Text>
          <Switch value={beatMix} onValueChange={(v) => {
            setBeatMix(v);
            musicPlayer.setBeatMixEnabled(v);
          }} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>音量</Text>
          <Slider
            style={styles.volumeSlider}
            value={volume}
            onValueChange={(v) => {
              setVolume(v);
              musicPlayer.setVolume(v);
            }}
            minimumValue={0}
            maximumValue={1}
          />
        </View>
      </View>

      {/* 工具栏 */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={loadMusicLibrary}>
          <Text style={styles.toolButtonText}>🔄 刷新</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toolButton, analyzing && styles.toolButtonDisabled]} 
          onPress={analyzeBPM}
          disabled={analyzing}
        >
          <Text style={styles.toolButtonText}>
            {analyzing ? `分析中 ${Math.round(analyzeProgress * 100)}%` : '🎵 分析 BPM'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 音乐列表 */}
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        renderItem={renderTrackItem}
        style={styles.trackList}
        contentContainerStyle={styles.trackListContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {isLoading ? '加载中...' : '暂无音乐\n点击刷新加载本地音乐'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1DB954',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  cadenceSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cadenceDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  cadenceValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#1DB954',
  },
  cadenceLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  cadenceStats: {
    flex: 1,
    alignItems: 'center',
  },
  statText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  detectButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  detectButtonActive: {
    backgroundColor: '#e74c3c',
  },
  detectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nowPlaying: {
    backgroundColor: '#282828',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  nowPlayingLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },
  nowPlayingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  nowPlayingBPM: {
    fontSize: 14,
    color: '#1DB954',
    marginTop: 4,
  },
  playButton: {
    backgroundColor: '#1DB954',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settings: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 14,
  },
  volumeSlider: {
    width: 120,
    height: 40,
  },
  toolbar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  toolButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toolButtonDisabled: {
    opacity: 0.5,
  },
  toolButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  trackList: {
    flex: 1,
  },
  trackListContent: {
    padding: 16,
  },
  trackItem: {
    flexDirection: 'row',
    backgroundColor: '#282828',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  trackItemActive: {
    backgroundColor: '#1DB954',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  trackArtist: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  trackMeta: {
    alignItems: 'flex-end',
  },
  trackBPM: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playingIndicator: {
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});
