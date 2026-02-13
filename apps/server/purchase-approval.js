const db = require('./db');

/**
 * 구매 승인 요청 생성
 */
async function createPurchaseRequest(tripId, item) {
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후 만료
    const result = await db.query(
      `INSERT INTO purchase_requests 
        (trip_id, item_type, item_name, destination, travel_date, current_price, predicted_low, recommendation, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_approval', $9)
       RETURNING *`,
      [tripId, item.type, item.name, item.destination || '', item.travelDate || '',
       item.currentPrice, item.predictedLow, item.recommendation, expiresAt]
    );
    console.log(`[PurchaseApproval] Created request #${result.rows[0].id} for ${item.name}`);
    return result.rows[0];
  } catch (err) {
    console.error('[PurchaseApproval] createPurchaseRequest error:', err.message);
    throw err;
  }
}

/**
 * 구매 승인
 */
async function approvePurchase(requestId) {
  try {
    const result = await db.query(
      `UPDATE purchase_requests 
       SET status = 'approved', user_response = 'approved'
       WHERE id = $1 AND status = 'pending_approval'
       RETURNING *`,
      [requestId]
    );
    if (result.rows.length === 0) {
      throw new Error('Request not found or not pending');
    }
    console.log(`[PurchaseApproval] Approved request #${requestId}`);
    
    // Auto-execute purchase (demo: just change status)
    await executePurchase(requestId);
    return result.rows[0];
  } catch (err) {
    console.error('[PurchaseApproval] approvePurchase error:', err.message);
    throw err;
  }
}

/**
 * 구매 거절
 */
async function rejectPurchase(requestId) {
  try {
    const result = await db.query(
      `UPDATE purchase_requests 
       SET status = 'rejected', user_response = 'rejected'
       WHERE id = $1 AND status = 'pending_approval'
       RETURNING *`,
      [requestId]
    );
    if (result.rows.length === 0) {
      throw new Error('Request not found or not pending');
    }
    console.log(`[PurchaseApproval] Rejected request #${requestId}`);
    return result.rows[0];
  } catch (err) {
    console.error('[PurchaseApproval] rejectPurchase error:', err.message);
    throw err;
  }
}

/**
 * 결제 실행 (데모: 상태만 변경)
 */
async function executePurchase(requestId) {
  try {
    const result = await db.query(
      `UPDATE purchase_requests 
       SET status = 'purchased', purchased_at = NOW()
       WHERE id = $1 AND status = 'approved'
       RETURNING *`,
      [requestId]
    );
    if (result.rows.length === 0) {
      // Already purchased or wrong status — skip silently
      return null;
    }
    console.log(`[PurchaseApproval] Executed purchase #${requestId} (demo)`);
    return result.rows[0];
  } catch (err) {
    console.error('[PurchaseApproval] executePurchase error:', err.message);
    throw err;
  }
}

/**
 * 대기 중인 승인 요청 목록
 */
async function getPendingRequests() {
  try {
    // Expire old requests first
    await db.query(
      `UPDATE purchase_requests SET status = 'expired' 
       WHERE status = 'pending_approval' AND expires_at < NOW()`
    );
    
    const result = await db.query(
      `SELECT * FROM purchase_requests 
       WHERE status = 'pending_approval'
       ORDER BY created_at DESC`
    );
    return result.rows;
  } catch (err) {
    console.error('[PurchaseApproval] getPendingRequests error:', err.message);
    return [];
  }
}

/**
 * 구매 이력
 */
async function getPurchaseHistory() {
  try {
    const result = await db.query(
      `SELECT * FROM purchase_requests 
       ORDER BY created_at DESC
       LIMIT 50`
    );
    return result.rows;
  } catch (err) {
    console.error('[PurchaseApproval] getPurchaseHistory error:', err.message);
    return [];
  }
}

module.exports = {
  createPurchaseRequest,
  approvePurchase,
  rejectPurchase,
  executePurchase,
  getPendingRequests,
  getPurchaseHistory,
};
