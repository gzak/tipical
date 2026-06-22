namespace Tipical.Core.Models;

/// <summary>Describes the tip suggestion observed at a business.</summary>
public enum TippingPolicy
{
    /// <summary>The business does not request tips.</summary>
    NoTips = 0,

    /// <summary>Tips are requested and calculated on the pre-tax subtotal.</summary>
    TipsExcludeTax = 1,

    /// <summary>Tips are requested and calculated on the post-tax total.</summary>
    TipsIncludeTax = 2
}
