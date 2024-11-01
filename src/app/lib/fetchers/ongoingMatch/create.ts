export async function createOngoingMatch(data: {
    score_threshold: number;
    round_id: number;
    current_shuffler_index: number;
    seating_order_ids: any[] | undefined
}) {
    const response = await fetch('/api/ongoing-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to create ongoing match: ${response.statusText}`);
    }

    return response.json();
}