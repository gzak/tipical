namespace Tipical.Core.Models;

public enum TippingPolicy
{
    NoTips = 0,           // Best - no tips requested
    TipsExcludeTax = 1,   // Middle - tips but calculated before tax
    TipsIncludeTax = 2    // Worst - tips calculated on post-tax total
}
