import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { badgeDetails } from '../../../hooks/badgeUtils';
import { useEffect } from 'react';

const RankBadgeSection = ({
  level,
  xp,
  badges,
  userName,
}: {
  level: number;
  xp: number;
  badges: { name: string }[];
  userName: string;
}) => {
  const xpToNextLevel = 500;
  const progressPercent = Math.min((xp % xpToNextLevel) / xpToNextLevel, 1);

  useEffect(() => {
    console.log("RankBadgeSection received badges:", badges);
  }, [badges]);
  

  return (
    <View style={styles.wrapper}>
      
      {/* Badge Icons Row */}
      {badges.length > 0 && (
        <View style={styles.badgesRow}>
          {badges.map((badge, index) => {
            const badgeInfo = badgeDetails[badge.name];
            if (!badgeInfo) return null;

            return (
              <TouchableOpacity
                key={index}
                style={styles.badgeIconWrapper}
                onPress={() => {
                  Alert.alert(badge.name, `${userName} ${badgeInfo.description}`);
                }}
              >
                <FontAwesomeIcon icon={badgeInfo.icon} size={36} color={badgeInfo.color || '#555'} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* XP Progress Bar */}
      <View style={styles.progressBarWrapper}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progressPercent * 100}%` }]} />
        </View>

        {/* Level + XP in One Row */}
        <View style={styles.xpLevelRow}>
          <Text style={styles.levelText}>Level {level}</Text>
          <Text style={styles.xpText}>{xp % xpToNextLevel} / {xpToNextLevel} XP</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18, 
    marginTop: 4,
    flexWrap: 'wrap',
  },
  badgeIconWrapper: {
    marginHorizontal: 16, 
  },
  progressBarWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007bff',
  },
  xpLevelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
    paddingHorizontal: 6,
  },
  xpText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default RankBadgeSection;
