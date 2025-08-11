import connectDB from './mongodb';
import User from '@/models/User';

/**
 * Check if user has enough credits and consume them if available
 * @param {string} userId - User ID
 * @param {number} requiredCredits - Number of credits required (default: 1)
 * @returns {Object} - { success: boolean, message: string, remainingCredits?: number }
 */
export async function checkAndConsumeCredit(userId, requiredCredits = 1) {
  try {
    await connectDB();
    
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    if (!user.hasEnoughCredits(requiredCredits)) {
      return {
        success: false,
        message: 'Insufficient credits. Please top up your account.',
        remainingCredits: user.credits
      };
    }

    // Consume the credits
    const consumed = user.consumeCredits(requiredCredits);
    
    if (!consumed) {
      return {
        success: false,
        message: 'Failed to consume credits'
      };
    }

    await user.save();

    return {
      success: true,
      message: 'Credits consumed successfully',
      remainingCredits: user.credits
    };
  } catch (error) {
    console.error('Error in checkAndConsumeCredit:', error);
    return {
      success: false,
      message: 'Internal server error'
    };
  }
}

/**
 * Get user's current credit balance
 * @param {string} userId - User ID
 * @returns {Object} - { success: boolean, credits?: number, message?: string }
 */
export async function getUserCredits(userId) {
  try {
    await connectDB();
    
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    return {
      success: true,
      credits: user.credits
    };
  } catch (error) {
    console.error('Error in getUserCredits:', error);
    return {
      success: false,
      message: 'Internal server error'
    };
  }
}

/**
 * Add credits to user account
 * @param {string} userId - User ID
 * @param {number} amount - Amount of credits to add
 * @returns {Object} - { success: boolean, newBalance?: number, message?: string }
 */
export async function addCreditsToUser(userId, amount) {
  try {
    await connectDB();
    
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    const newBalance = user.addCredits(amount);
    await user.save();

    return {
      success: true,
      newBalance: newBalance,
      message: `${amount} credits added successfully`
    };
  } catch (error) {
    console.error('Error in addCreditsToUser:', error);
    return {
      success: false,
      message: 'Internal server error'
    };
  }
} 