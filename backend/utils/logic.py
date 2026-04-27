import logging
from utils.common import load_json

logger = logging.getLogger(__name__)

def filter_college_data(colleges, user_rank, is_explorer=False):
    """
    Filters college data based on Explorer vs Ranked mode.
    - If Ranked: Show cutoff_rank and match probability.
    - If Explorer: Hide all rank data. Show Management Quota Fee Structure.
    """
    results = []
    for college in colleges:
        college_data = {
            "college_name": college.get("college_name"),
            "location": college.get("location"),
            "infrastructure_rating": college.get("infrastructure_rating"),
            "academics_rating": college.get("academics_rating"),
            "placement_rating": college.get("placement_rating"),
            "average_package": college.get("average_package"),
            "highest_package": college.get("highest_package"),
            "top_companies": college.get("top_companies"),
            "pros": college.get("pros"),
            "cons": college.get("cons")
        }

        if is_explorer:
            # Hide rank data, show management fees
            college_data["management_fees"] = college.get("management_fees", {})
            college_data["is_explorer"] = True
        else:
            # Show cutoff rank and match probability
            college_data["cutoff_rank"] = college.get("cutoff_rank", {})
            # Simple match probability calculation
            college_data["match_probability"] = calculate_match_probability(user_rank, college.get("cutoff_rank", {}).get("KCET", {}))
            college_data["is_explorer"] = False
        
        results.append(college_data)
    
    return results

def calculate_match_probability(user_rank, cutoffs):
    """Calculate a simple match probability percentage."""
    if not user_rank or not cutoffs:
        return "N/A"
    
    # Get the minimum cutoff rank across branches
    min_cutoff = 999999
    for branch, range_str in cutoffs.items():
        try:
            # Example: "1000-3000" -> 3000
            val = int(range_str.split('-')[-1].replace('+', ''))
            if val < min_cutoff:
                min_cutoff = val
        except:
            continue
    
    if user_rank <= min_cutoff:
        return "High"
    elif user_rank <= min_cutoff * 1.5:
        return "Moderate"
    else:
        return "Reach"
